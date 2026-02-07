import { auth } from "@/auth";
import { uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
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

    await prisma.$transaction(async (tx) => {
      await tx.projectTranslation.deleteMany();
      await tx.project.deleteMany();
      await tx.blogPostTranslation.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.workExperienceTranslation.deleteMany();
      await tx.workExperience.deleteMany();
      await tx.profileTranslation.deleteMany();
      await tx.profile.deleteMany();
      await tx.skill.deleteMany();

      if (skills?.length) {
        await tx.skill.createMany({
          data: skills.map((s: any) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          })),
        });
      }

      // Profile
      if (profile) {
        await tx.profile.create({
          data: {
            avatar: profile.avatar,
            email: profile.email,
            github: profile.github,
            linkedin: profile.linkedin,
            translations: {
              create: profile.translations.map((t: any) => ({
                language: t.language,
                name: t.name,
                title: t.title,
                greetingText: t.greetingText,
                description: t.description,
                aboutTitle: t.aboutTitle,
                aboutDescription: t.aboutDescription,
              })),
            },
          },
        });
      }

      // Work Experiences
      if (experiences?.length) {
        for (const exp of experiences) {
          await tx.workExperience.create({
            data: {
              company: exp.company,
              logo: exp.logo,
              startDate: exp.startDate,
              endDate: exp.endDate,
              translations: {
                create: exp.translations.map((t: any) => ({
                  language: t.language,
                  role: t.role,
                  description: t.description,
                  locationType: t.locationType,
                })),
              },
            },
          });
        }
      }

      if (blogs?.length) {
        for (const blog of blogs) {
          await tx.blogPost.create({
            data: {
              slug: blog.slug,
              coverImage: blog.coverImage,
              featured: blog.featured,
              tags: blog.tags,
              date: blog.date,
              readTime: blog.readTime,
              translations: {
                create: blog.translations.map((t: any) => ({
                  language: t.language,
                  title: t.title,
                  description: t.description,
                  content: t.content,
                })),
              },
            },
          });
        }
      }

      if (projects?.length) {
        for (const project of projects) {
          await tx.project.create({
            data: {
              slug: project.slug,
              status: project.status,
              category: project.category,
              github: project.github,
              liveDemo: project.liveDemo,
              featured: project.featured,
              coverImage: project.coverImage,
              images: project.images,
              technologies: {
                connect: project.technologies.map((tech: any) => ({
                  id: tech.id,
                })),
              },
              translations: {
                create: project.translations.map((t: any) => ({
                  language: t.language,
                  title: t.title,
                  shortDescription: t.shortDescription,
                  fullDescription: t.fullDescription,
                })),
              },
            },
          });
        }
      }
    });

    const assetsFolder = zip.folder("assets");
    if (assetsFolder) {
      const uploadPromises: Promise<any>[] = [];

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
            console.log(`Restored asset: ${relativePath}`);
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
