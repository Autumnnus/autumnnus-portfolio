/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
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

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const dataFile = zip.file("data.json");
    if (!dataFile)
      return new Response("Invalid backup: data.json missing", { status: 400 });

    const jsonContent = await dataFile.async("string");
    const { data } = JSON.parse(jsonContent);
    const { projects, blogs, profile, experiences, skills } = data;

    await db.transaction(async (tx) => {
      // ── Delete in FK-safe order ──────────────────────────────────────
      // _projectToSkill depends on both project and skill, so delete first
      // if either parent table is being replaced.
      if (sections.has("projects") || sections.has("skills")) {
        await tx.delete(_projectToSkill);
      }
      if (sections.has("projects")) {
        await tx.delete(projectTranslation);
        await tx.delete(project);
      }
      if (sections.has("blogs")) {
        await tx.delete(blogPostTranslation);
        await tx.delete(blogPost);
      }
      if (sections.has("experiences")) {
        await tx.delete(workExperienceTranslation);
        await tx.delete(workExperience);
      }
      if (sections.has("profile")) {
        await tx.delete(questTranslation);
        await tx.delete(quest);
        await tx.delete(profileTranslation);
        await tx.delete(profileTable);
      }
      if (sections.has("skills")) {
        await tx.delete(skill);
      }

      // ── Insert: skills first (needed for project relations) ───────────
      if (sections.has("skills") && skills?.length) {
        await tx.insert(skill).values(
          (skills as any[]).map((s) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          })),
        );
      }

      // ── Insert: profile ──────────────────────────────────────────────
      if (sections.has("profile") && profile) {
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
      if (sections.has("experiences") && experiences?.length) {
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
      if (sections.has("blogs") && blogs?.length) {
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
              categoryId: blog.categoryId,
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
      if (sections.has("projects") && projects?.length) {
        // Get skill IDs that actually exist (handles skills-not-selected case)
        const existingSkillIds = new Set(
          (await tx.select({ id: skill.id }).from(skill)).map((r) => r.id),
        );

        for (const prj of projects as any[]) {
          const [newProject] = await tx
            .insert(project)
            .values({
              id: prj.id,
              slug: prj.slug,
              status: prj.status,
              categoryId: prj.categoryId,
              github: prj.github,
              liveDemo: prj.liveDemo,
              featured: prj.featured,
              coverImage: prj.coverImage,
              images: prj.images,
              imageAlt: prj.imageAlt,
            })
            .returning();

          if (prj.technologies?.length) {
            const validTechs = (prj.technologies as any[]).filter((tech) =>
              existingSkillIds.has(tech.id),
            );
            if (validTechs.length) {
              await tx.insert(_projectToSkill).values(
                validTechs.map((tech) => ({
                  A: newProject.id,
                  B: tech.id,
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
    });

    // ── Upload assets (filtered by sections) ────────────────────────────
    const assetsFolder = zip.folder("assets");
    if (assetsFolder) {
      // Build allowed object name set from selected sections
      const allowedAssets = new Set<string>();

      if (sections.has("profile") && profile?.avatar) {
        const name = getObjectName(profile.avatar);
        if (name) allowedAssets.add(name);
      }
      if (sections.has("projects")) {
        for (const p of (projects as any[]) ?? []) {
          const cover = getObjectName(p.coverImage);
          if (cover) allowedAssets.add(cover);
          for (const img of p.images ?? []) {
            const imgName = getObjectName(img);
            if (imgName) allowedAssets.add(imgName);
          }
        }
      }
      if (sections.has("blogs")) {
        for (const b of (blogs as any[]) ?? []) {
          const cover = getObjectName(b.coverImage);
          if (cover) allowedAssets.add(cover);
        }
      }
      if (sections.has("skills")) {
        for (const s of (skills as any[]) ?? []) {
          if (s.icon?.startsWith("http")) {
            const name = getObjectName(s.icon);
            if (name) allowedAssets.add(name);
          }
        }
      }
      if (sections.has("experiences")) {
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
