import { auth } from "@/auth";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
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

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const dataFile = zip.file("data.json");
    if (!dataFile) {
      return new Response("Invalid backup: data.json missing", { status: 400 });
    }

    const jsonContent = await dataFile.async("string");
    const { data } = JSON.parse(jsonContent);
    const { projects, blogs, profile, experiences, skills } = data;

    await db.transaction(async (tx) => {
      await tx.delete(projectTranslation);
      await tx.delete(_projectToSkill);
      await tx.delete(project);
      await tx.delete(blogPostTranslation);
      await tx.delete(blogPost);
      await tx.delete(workExperienceTranslation);
      await tx.delete(workExperience);
      await tx.delete(questTranslation);
      await tx.delete(quest);
      await tx.delete(profileTranslation);
      await tx.delete(profile);
      await tx.delete(skill);

      if (skills?.length) {
        await tx.insert(skill).values(
          (skills as any[]).map((s) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          })),
        );
      }

      if (profile) {
        const pr = profile as any;
        const newProfileRes = (await tx
          .insert(profile)
          .values({
            id: pr.id,
            avatar: pr.avatar,
            email: pr.email,
            github: pr.github,
            linkedin: pr.linkedin,
          })
          .returning()) as any;
        const newProfile = newProfileRes[0];

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
            const newQuestRes = (await tx
              .insert(quest)
              .values({
                profileId: newProfile.id,
                order: q.order,
                id: q.id,
              })
              .returning()) as any;
            const newQuest = newQuestRes[0];

            if (q.translations?.length) {
              await tx.insert(questTranslation).values(
                q.translations.map((t: any) => ({
                  questId: newQuest.id,
                  language: t.language,
                  title: t.title,
                  description: t.description,
                })),
              );
            }
          }
        }
      }

      if (experiences?.length) {
        for (const exp of experiences as any[]) {
          const newExperienceRes = (await tx
            .insert(workExperience)
            .values({
              id: exp.id,
              company: exp.company,
              logo: exp.logo,
              startDate: exp.startDate ? new Date(exp.startDate) : null,
              endDate: exp.endDate ? new Date(exp.endDate) : null,
            })
            .returning()) as any;
          const newExperience = newExperienceRes[0];

          if (exp.translations?.length) {
            await tx.insert(workExperienceTranslation).values(
              exp.translations.map((t: any) => ({
                workExperienceId: newExperience.id,
                language: t.language,
                role: t.role,
                description: t.description,
                locationType: t.locationType,
              })),
            );
          }
        }
      }

      if (blogs?.length) {
        for (const blog of blogs as any[]) {
          const newBlogRes = (await tx
            .insert(blogPost)
            .values({
              id: blog.id,
              slug: blog.slug,
              coverImage: blog.coverImage,
              featured: blog.featured,
              tags: blog.tags,
            })
            .returning()) as any;
          const newBlog = newBlogRes[0];

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
              })),
            );
          }
        }
      }

      if (projects?.length) {
        for (const prj of projects as any[]) {
          const newProjectRes = (await tx
            .insert(project)
            .values({
              id: prj.id,
              slug: prj.slug,
              status: prj.status,
              category: prj.category,
              github: prj.github,
              liveDemo: prj.liveDemo,
              featured: prj.featured,
              coverImage: prj.coverImage,
              images: prj.images,
            })
            .returning()) as any;
          const newProject = newProjectRes[0];

          if (prj.technologies?.length) {
            await tx.insert(_projectToSkill).values(
              (prj.technologies as any[]).map((tech) => ({
                A: newProject.id,
                B: tech.id,
              })),
            );
          }

          if (prj.translations?.length) {
            await tx.insert(projectTranslation).values(
              prj.translations.map((t: any) => ({
                projectId: newProject.id,
                language: t.language,
                title: t.title,
                shortDescription: t.shortDescription,
                fullDescription: t.fullDescription,
              })),
            );
          }
        }
      }
    });

    const assetsFolder = zip.folder("assets");
    if (assetsFolder) {
      const uploadPromises: Promise<void>[] = [];

      assetsFolder.forEach((relativePath, fileEntry) => {
        if (fileEntry.dir) return;

        const p = async () => {
          const content = await fileEntry.async("nodebuffer");
          const ext = path.extname(relativePath).toLowerCase();
          let contentType = "application/octet-stream";
          if (ext === ".png") contentType = "image/png";
          else if (ext === ".jpg" || ext === ".jpeg")
            contentType = "image/jpeg";
          else if (ext === ".svg") contentType = "image/svg+xml";
          else if (ext === ".webp") contentType = "image/webp";

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
