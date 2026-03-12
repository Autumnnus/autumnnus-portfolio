/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
  category,
  embedding,
  profile as profileTable,
  profileTranslation,
  project,
  projectTranslation,
  quest,
  questTranslation,
  skill,
  workExperience,
  workExperienceTranslation,
} from "@/lib/db/schema";
import { uploadFile } from "@/lib/minio";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
import path from "path";

const BUCKET = process.env.MINIO_BUCKET_NAME || "autumnnus-assets";

function getObjectName(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) {
    const parts = url.split(`/${BUCKET}/`);
    return parts[1] ?? null;
  }
  return url;
}

function normalizeCategoryType(value: unknown): "project" | "blog" | null {
  return value === "project" || value === "blog" ? value : null;
}

function normalizeEmbeddingSourceType(
  value: unknown,
): "project" | "blog" | "profile" | "experience" | null {
  if (
    value === "project" ||
    value === "blog" ||
    value === "profile" ||
    value === "experience"
  ) {
    return value;
  }
  return null;
}

function normalizeEmbeddingVector(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const normalized = value
    .map((n) => (typeof n === "number" ? n : Number(n)))
    .filter((n) => Number.isFinite(n));
  if (normalized.length !== value.length) return null;
  return normalized;
}

function normalizeDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getTechnologySkillId(tech: unknown): string | null {
  if (!tech || typeof tech !== "object") return null;
  const row = tech as Record<string, unknown>;
  if (typeof row.id === "string") return row.id;
  if (typeof row.B === "string") return row.B;
  if (
    row.skill &&
    typeof row.skill === "object" &&
    typeof (row.skill as Record<string, unknown>).id === "string"
  ) {
    return (row.skill as Record<string, unknown>).id as string;
  }
  return null;
}

function getTechnologySkillData(tech: unknown) {
  if (!tech || typeof tech !== "object") return null;
  const row = tech as Record<string, unknown>;
  const source =
    row.skill && typeof row.skill === "object"
      ? (row.skill as Record<string, unknown>)
      : row;
  const id = typeof source.id === "string" ? source.id : null;
  const key = typeof source.key === "string" ? source.key : null;
  const name = typeof source.name === "string" ? source.name : null;
  const icon = typeof source.icon === "string" ? source.icon : null;
  if (!id && !key) return null;
  return { id, key, name, icon };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user?.email ||
      session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return new Response("No file provided", { status: 400 });

    // Parse sections (default: all)
    const sectionsRaw = formData.get("sections") as string | null;
    const sections: Set<string> = sectionsRaw
      ? new Set(JSON.parse(sectionsRaw))
      : new Set(["projects", "blogs", "skills", "experiences", "profile"]);
    const includeProjects = sections.has("projects");
    const includeBlogs = sections.has("blogs");
    const includeExperiences = sections.has("experiences");
    const includeProfile = sections.has("profile");
    const replaceSkills = sections.has("skills");
    const includeSkills = replaceSkills || includeProjects;

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const dataFile = zip.file("data.json");
    if (!dataFile)
      return new Response("Invalid backup: data.json missing", { status: 400 });

    const jsonContent = await dataFile.async("string");
    const { data } = JSON.parse(jsonContent);
    const { projects, blogs, profile, experiences, skills, categories, embeddings } =
      data;

    await db.transaction(async (tx) => {
      // ── Delete in FK-safe order ──────────────────────────────────────
      // _projectToSkill depends on both project and skill, so delete first
      // if either parent table is being replaced.
      if (includeProjects || replaceSkills) {
        await tx.delete(_projectToSkill);
      }
      if (includeProjects) {
        await tx.delete(projectTranslation);
        await tx.delete(project);
      }
      if (includeBlogs) {
        await tx.delete(blogPostTranslation);
        await tx.delete(blogPost);
      }
      if (includeExperiences) {
        await tx.delete(workExperienceTranslation);
        await tx.delete(workExperience);
      }
      if (includeProfile) {
        await tx.delete(questTranslation);
        await tx.delete(quest);
        await tx.delete(profileTranslation);
        await tx.delete(profileTable);
      }
      if (replaceSkills) {
        await tx.delete(skill);
      }
      if (includeProjects) {
        await tx
          .delete(embedding)
          .where(eq(embedding.sourceType, "project"));
      }
      if (includeBlogs) {
        await tx.delete(embedding).where(eq(embedding.sourceType, "blog"));
      }
      if (includeExperiences) {
        await tx
          .delete(embedding)
          .where(eq(embedding.sourceType, "experience"));
      }
      if (includeProfile) {
        await tx.delete(embedding).where(eq(embedding.sourceType, "profile"));
      }

      let categoryById = new Map<
        string,
        { id: string; name: string; type: "project" | "blog" }
      >();
      const categoryByKey = new Map<
        string,
        { id: string; name: string; type: "project" | "blog" }
      >();
      const categoryIdMap = new Map<string, string>();

      const needsCategorySupport =
        includeProjects || includeBlogs;

      if (needsCategorySupport) {
        const existingCategories = await tx
          .select({
            id: category.id,
            name: category.name,
            type: category.type,
          })
          .from(category);

        categoryById = new Map(
          existingCategories.map((c) => [
            c.id,
            { id: c.id, name: c.name, type: c.type },
          ]),
        );

        for (const c of existingCategories) {
          categoryByKey.set(`${c.type}:${c.name.toLowerCase()}`, {
            id: c.id,
            name: c.name,
            type: c.type,
          });
        }

        for (const cat of (categories as any[]) ?? []) {
          const sourceId = typeof cat.id === "string" ? cat.id : null;
          const name = typeof cat.name === "string" ? cat.name.trim() : "";
          const type = normalizeCategoryType(cat.type);
          if (!name || !type) continue;

          let resolvedId: string | null = null;

          if (sourceId && categoryById.has(sourceId)) {
            resolvedId = sourceId;
          } else {
            const key = `${type}:${name.toLowerCase()}`;
            const existing = categoryByKey.get(key);
            if (existing) {
              resolvedId = existing.id;
            } else {
              const [created] = await tx
                .insert(category)
                .values({ name, type })
                .returning({
                  id: category.id,
                  name: category.name,
                  type: category.type,
                });
              resolvedId = created.id;
              categoryById.set(created.id, {
                id: created.id,
                name: created.name,
                type: created.type,
              });
              categoryByKey.set(`${created.type}:${created.name.toLowerCase()}`, {
                id: created.id,
                name: created.name,
                type: created.type,
              });
            }
          }

          if (sourceId && resolvedId) {
            categoryIdMap.set(sourceId, resolvedId);
          }
        }
      }

      const resolveCategoryId = (
        sourceCategoryId: unknown,
        expectedType: "project" | "blog",
      ): string | null => {
        if (typeof sourceCategoryId !== "string") return null;

        const mapped = categoryIdMap.get(sourceCategoryId);
        if (mapped) return mapped;

        const direct = categoryById.get(sourceCategoryId);
        if (direct && direct.type === expectedType) return direct.id;

        return null;
      };

      const skillIdMap = new Map<string, string>();

      // ── Insert: skills first (needed for project relations) ───────────
      if (includeSkills) {
        const skillCandidates = new Map<
          string,
          { id: string; key: string; name: string; icon: string }
        >();

        for (const s of (skills as any[]) ?? []) {
          if (
            typeof s?.id !== "string" ||
            typeof s?.key !== "string" ||
            typeof s?.name !== "string" ||
            typeof s?.icon !== "string"
          ) {
            continue;
          }
          skillCandidates.set(s.id, {
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          });
        }

        for (const prj of (projects as any[]) ?? []) {
          for (const tech of prj?.technologies ?? []) {
            const candidate = getTechnologySkillData(tech);
            if (!candidate?.id || !candidate.key || !candidate.name || !candidate.icon)
              continue;
            if (!skillCandidates.has(candidate.id)) {
              skillCandidates.set(candidate.id, {
                id: candidate.id,
                key: candidate.key,
                name: candidate.name,
                icon: candidate.icon,
              });
            }
          }
        }

        if (replaceSkills) {
          const rows = Array.from(skillCandidates.values());
          if (rows.length) {
            await tx.insert(skill).values(rows);
          }
          for (const sourceId of skillCandidates.keys()) {
            skillIdMap.set(sourceId, sourceId);
          }
        } else {
          const existingSkills = await tx
            .select({
              id: skill.id,
              key: skill.key,
            })
            .from(skill);

          const byId = new Map(existingSkills.map((s) => [s.id, s.id]));
          const byKey = new Map(existingSkills.map((s) => [s.key, s.id]));

          for (const row of skillCandidates.values()) {
            if (byId.has(row.id)) {
              skillIdMap.set(row.id, row.id);
              continue;
            }
            const existingByKey = byKey.get(row.key);
            if (existingByKey) {
              skillIdMap.set(row.id, existingByKey);
              continue;
            }

            const [created] = await tx
              .insert(skill)
              .values({
                id: row.id,
                key: row.key,
                name: row.name,
                icon: row.icon,
              })
              .returning({ id: skill.id });

            skillIdMap.set(row.id, created.id);
            byId.set(created.id, created.id);
            byKey.set(row.key, created.id);
          }
        }
      }

      // ── Insert: profile ──────────────────────────────────────────────
      if (includeProfile && profile) {
        const pr = profile as any;
        const [newProfile] = await tx
          .insert(profileTable)
          .values({
            id: pr.id,
            avatar: pr.avatar,
            email: pr.email,
            github: pr.github,
            linkedin: pr.linkedin,
          })
          .returning();

        if (pr.translations?.length) {
          await tx.insert(profileTranslation).values(
            pr.translations.map((t: any) => ({
              profileId: newProfile.id,
              language: t.language,
              name: t.name,
              title: t.title,
              greetingText: t.greetingText,
              description: t.description,
              aboutTitle: t.aboutTitle,
              aboutDescription: t.aboutDescription,
            })),
          );
        }

        if (pr.quests?.length) {
          for (const q of pr.quests as any[]) {
            const [newQuest] = await tx
              .insert(quest)
              .values({
                id: q.id,
                profileId: newProfile.id,
                order: q.order,
                completed: q.completed ?? false,
              })
              .returning();

            if (q.translations?.length) {
              await tx.insert(questTranslation).values(
                q.translations.map((t: any) => ({
                  questId: newQuest.id,
                  language: t.language,
                  title: t.title,
                })),
              );
            }
          }
        }
      }

      // ── Insert: experiences ──────────────────────────────────────────
      if (includeExperiences && experiences?.length) {
        for (const exp of experiences as any[]) {
          const [newExp] = await tx
            .insert(workExperience)
            .values({
              id: exp.id,
              company: exp.company,
              logo: exp.logo,
              startDate: exp.startDate ? new Date(exp.startDate) : null,
              endDate: exp.endDate ? new Date(exp.endDate) : null,
            })
            .returning();

          if (exp.translations?.length) {
            await tx.insert(workExperienceTranslation).values(
              exp.translations.map((t: any) => ({
                workExperienceId: newExp.id,
                language: t.language,
                role: t.role,
                description: t.description,
                locationType: t.locationType,
              })),
            );
          }
        }
      }

      // ── Insert: blogs ────────────────────────────────────────────────
      if (includeBlogs && blogs?.length) {
        for (const blog of blogs as any[]) {
          const [newBlog] = await tx
            .insert(blogPost)
            .values({
              id: blog.id,
              slug: blog.slug,
              coverImage: blog.coverImage,
              featured: blog.featured,
              tags: blog.tags,
              status: blog.status ?? "draft",
              commentsEnabled: blog.commentsEnabled ?? true,
              categoryId: resolveCategoryId(blog.categoryId, "blog"),
              imageAlt: blog.imageAlt,
            })
            .returning();

          if (blog.translations?.length) {
            await tx.insert(blogPostTranslation).values(
              blog.translations.map((t: any) => ({
                blogPostId: newBlog.id,
                language: t.language,
                title: t.title,
                description: t.description,
                content: t.content,
                readTime: t.readTime,
                date: t.date ? String(t.date) : new Date().toISOString(),
                excerpt: t.excerpt,
                keywords: t.keywords ?? [],
                metaDescription: t.metaDescription,
                metaTitle: t.metaTitle,
              })),
            );
          }
        }
      }

      // ── Insert: projects ─────────────────────────────────────────────
      if (includeProjects && projects?.length) {
        for (const prj of projects as any[]) {
          const [newProject] = await tx
            .insert(project)
            .values({
              id: prj.id,
              slug: prj.slug,
              status: prj.status,
              categoryId: resolveCategoryId(prj.categoryId, "project"),
              github: prj.github,
              liveDemo: prj.liveDemo,
              featured: prj.featured,
              coverImage: prj.coverImage,
              images: prj.images,
              imageAlt: prj.imageAlt,
            })
            .returning();

          if (prj.technologies?.length) {
            const validTechs = (prj.technologies as any[])
              .map((tech) => {
                const sourceSkillId = getTechnologySkillId(tech);
                if (!sourceSkillId) return null;
                return skillIdMap.get(sourceSkillId) || sourceSkillId;
              })
              .filter((id): id is string => !!id);
            if (validTechs.length) {
              await tx.insert(_projectToSkill).values(
                Array.from(new Set(validTechs)).map((skillId) => ({
                  A: newProject.id,
                  B: skillId,
                })),
              );
            }
          }

          if (prj.translations?.length) {
            await tx.insert(projectTranslation).values(
              prj.translations.map((t: any) => ({
                projectId: newProject.id,
                language: t.language,
                title: t.title,
                shortDescription: t.shortDescription,
                fullDescription: t.fullDescription,
                keywords: t.keywords ?? [],
                metaDescription: t.metaDescription,
                metaTitle: t.metaTitle,
              })),
            );
          }
        }
      }

      if (Array.isArray(embeddings) && embeddings.length > 0) {
        const allowedProjectIds = new Set(
          includeProjects
            ? ((projects as any[]) ?? [])
                .map((p) => p.id)
                .filter((id) => typeof id === "string")
            : [],
        );
        const allowedBlogIds = new Set(
          includeBlogs
            ? ((blogs as any[]) ?? [])
                .map((b) => b.id)
                .filter((id) => typeof id === "string")
            : [],
        );
        const allowedExperienceIds = new Set(
          includeExperiences
            ? ((experiences as any[]) ?? [])
                .map((e) => e.id)
                .filter((id) => typeof id === "string")
            : [],
        );
        const profileId =
          includeProfile && profile && typeof (profile as any).id === "string"
            ? (profile as any).id
            : null;

        const deduped = new Map<
          string,
          {
            id?: string;
            sourceType: "project" | "blog" | "profile" | "experience";
            sourceId: string;
            language: string;
            chunkText: string;
            chunkIndex: number;
            embedding: number[];
            metadata?: unknown;
            createdAt?: Date;
            updatedAt?: Date;
          }
        >();

        for (const row of embeddings as any[]) {
          const sourceType = normalizeEmbeddingSourceType(row?.sourceType);
          const sourceId = typeof row?.sourceId === "string" ? row.sourceId : null;
          const language = typeof row?.language === "string" ? row.language : null;
          const chunkText = typeof row?.chunkText === "string" ? row.chunkText : null;
          const chunkIndex =
            typeof row?.chunkIndex === "number"
              ? row.chunkIndex
              : Number(row?.chunkIndex);
          const vector = normalizeEmbeddingVector(row?.embedding);
          if (
            !sourceType ||
            !sourceId ||
            !language ||
            chunkText === null ||
            !Number.isInteger(chunkIndex) ||
            chunkIndex < 0 ||
            !vector
          ) {
            continue;
          }

          const isAllowed =
            (sourceType === "project" && allowedProjectIds.has(sourceId)) ||
            (sourceType === "blog" && allowedBlogIds.has(sourceId)) ||
            (sourceType === "experience" && allowedExperienceIds.has(sourceId)) ||
            (sourceType === "profile" && profileId === sourceId);

          if (!isAllowed) continue;

          const key = `${sourceType}:${sourceId}:${language}:${chunkIndex}`;
          deduped.set(key, {
            id: typeof row?.id === "string" ? row.id : undefined,
            sourceType,
            sourceId,
            language,
            chunkText,
            chunkIndex,
            embedding: vector,
            metadata: row?.metadata,
            createdAt: normalizeDate(row?.createdAt),
            updatedAt: normalizeDate(row?.updatedAt),
          });
        }

        const chunkSize = 200;
        const rows = Array.from(deduped.values());
        for (let i = 0; i < rows.length; i += chunkSize) {
          await tx.insert(embedding).values(rows.slice(i, i + chunkSize));
        }
      }
    });

    // ── Upload assets (filtered by sections) ────────────────────────────
    const assetsFolder = zip.folder("assets");
    if (assetsFolder) {
      // Build allowed object name set from selected sections
      const allowedAssets = new Set<string>();

      if (includeProfile && profile?.avatar) {
        const name = getObjectName(profile.avatar);
        if (name) allowedAssets.add(name);
      }
      if (includeProjects) {
        for (const p of (projects as any[]) ?? []) {
          const cover = getObjectName(p.coverImage);
          if (cover) allowedAssets.add(cover);
          for (const img of p.images ?? []) {
            const imgName = getObjectName(img);
            if (imgName) allowedAssets.add(imgName);
          }
        }
      }
      if (includeBlogs) {
        for (const b of (blogs as any[]) ?? []) {
          const cover = getObjectName(b.coverImage);
          if (cover) allowedAssets.add(cover);
        }
      }
      if (includeSkills) {
        for (const s of (skills as any[]) ?? []) {
          if (s.icon?.startsWith("http")) {
            const name = getObjectName(s.icon);
            if (name) allowedAssets.add(name);
          }
        }
      }
      if (includeExperiences) {
        for (const e of (experiences as any[]) ?? []) {
          const name = getObjectName(e.logo);
          if (name) allowedAssets.add(name);
        }
      }

      const uploadPromises: Promise<void>[] = [];

      assetsFolder.forEach((relativePath, fileEntry) => {
        if (fileEntry.dir) return;
        // Skip assets not belonging to selected sections
        if (!allowedAssets.has(relativePath)) return;

        const p = async () => {
          const content = await fileEntry.async("nodebuffer");
          const ext = path.extname(relativePath).toLowerCase();
          let contentType = "application/octet-stream";
          if (ext === ".png") contentType = "image/png";
          else if (ext === ".jpg" || ext === ".jpeg")
            contentType = "image/jpeg";
          else if (ext === ".svg") contentType = "image/svg+xml";
          else if (ext === ".webp") contentType = "image/webp";
          else if (ext === ".gif") contentType = "image/gif";

          try {
            await uploadFile(relativePath, content, contentType);
          } catch (err) {
            console.error(`Failed to restore asset: ${relativePath}`, err);
          }
        };
        uploadPromises.push(p());
      });

      await Promise.all(uploadPromises);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
