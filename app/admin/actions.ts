"use server";

import { auth } from "@/auth";
import { deleteFolder, uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { Language } from "@prisma/client";

export interface ProjectTranslationInput {
  language: Language;
  title: string;
  shortDescription: string;
  fullDescription: string;
}

export interface ProjectData {
  slug: string;
  status: string;
  category: string;
  github?: string | null;
  liveDemo?: string | null;
  featured: boolean;
  coverImage?: string | null;
  images: string[];
  translations: ProjectTranslationInput[];
  technologies: string[];
}

export interface BlogTranslationInput {
  language: Language;
  title: string;
  description: string;
  content: string;
  readTime: string;
  date: string;
}

export interface BlogData {
  slug: string;
  coverImage?: string | null;
  featured: boolean;
  tags: string[];
  translations: BlogTranslationInput[];
}

export interface ProfileTranslationInput {
  language: Language;
  name: string;
  title: string;
  greetingText: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
}

export interface ProfileData {
  avatar: string;
  email: string;
  github: string;
  linkedin: string;
  translations: ProfileTranslationInput[];
}

export interface ExperienceTranslationInput {
  language: Language;
  role: string;
  description: string;
  locationType: string;
}

export interface ExperienceData {
  company: string;
  logo: string;
  startDate?: Date | null;
  endDate?: Date | null;
  translations: ExperienceTranslationInput[];
}

export async function uploadImageAction(formData: FormData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  const customPath = formData.get("path") as string;

  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanFileName = file.name.replace(/\s+/g, "-");
  const filename = customPath
    ? `${customPath}/${Date.now()}-${cleanFileName}`
    : `${Date.now()}-${cleanFileName}`;

  const url = await uploadFile(filename, buffer, file.type);
  return { url };
}

export async function createProjectAction(data: ProjectData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  const existingProject = await prisma.project.findUnique({
    where: { slug: projectData.slug },
  });

  if (existingProject) {
    throw new Error(
      "Bu slug (URL) zaten başka bir proje tarafından kullanılıyor.",
    );
  }

  return await prisma.project.create({
    data: {
      ...projectData,
      images,
      translations: {
        create: translations,
      },
      technologies: {
        connect: technologies.map((id: string) => ({ id })),
      },
    },
  });
}

export async function updateProjectAction(id: string, data: ProjectData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  const existingProject = await prisma.project.findFirst({
    where: {
      slug: projectData.slug,
      NOT: { id },
    },
  });

  if (existingProject) {
    throw new Error(
      "Bu slug (URL) zaten başka bir proje tarafından kullanılıyor.",
    );
  }

  await prisma.projectTranslation.deleteMany({ where: { projectId: id } });

  return await prisma.project.update({
    where: { id },
    data: {
      ...projectData,
      images,
      translations: {
        create: translations,
      },
      technologies: {
        set: technologies.map((id: string) => ({ id })),
      },
    },
  });
}

export async function deleteProjectAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (project?.slug) {
    await deleteFolder(`projects/${project.slug}`);
  }

  return await prisma.project.delete({
    where: { id },
  });
}

export async function createBlogAction(data: BlogData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  const existingBlog = await prisma.blogPost.findUnique({
    where: { slug: blogData.slug },
  });

  if (existingBlog) {
    throw new Error(
      "Bu slug (URL) zaten başka bir blog yazısı tarafından kullanılıyor.",
    );
  }

  return await prisma.blogPost.create({
    data: {
      ...blogData,
      translations: {
        create: translations,
      },
    },
  });
}

export async function updateBlogAction(id: string, data: BlogData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  const existingBlog = await prisma.blogPost.findFirst({
    where: {
      slug: blogData.slug,
      NOT: { id },
    },
  });

  if (existingBlog) {
    throw new Error(
      "Bu slug (URL) zaten başka bir blog yazısı tarafından kullanılıyor.",
    );
  }

  await prisma.blogPostTranslation.deleteMany({ where: { blogPostId: id } });

  return await prisma.blogPost.update({
    where: { id },
    data: {
      ...blogData,
      translations: {
        create: translations,
      },
    },
  });
}

export async function deleteBlogAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const blog = await prisma.blogPost.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (blog?.slug) {
    await deleteFolder(`blog/${blog.slug}`);
  }

  return await prisma.blogPost.delete({
    where: { id },
  });
}

export async function createSkillAction(data: { name: string; icon: string }) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const key = data.name.toUpperCase().replace(/\s+/g, "_");

  return await prisma.skill.create({
    data: {
      name: data.name,
      icon: data.icon,
      key,
    },
  });
}
export async function updateProfileAction(data: ProfileData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...profileData } = data;

  const profile = await prisma.profile.findFirst();

  if (profile) {
    await prisma.profileTranslation.deleteMany({
      where: { profileId: profile.id },
    });
    return await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...profileData,
        translations: {
          create: translations,
        },
      },
    });
  } else {
    return await prisma.profile.create({
      data: {
        ...profileData,
        translations: {
          create: translations,
        },
      },
    });
  }
}

// Experience Actions
export async function createExperienceAction(data: ExperienceData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...experienceData } = data;

  return await prisma.workExperience.create({
    data: {
      ...experienceData,
      translations: {
        create: translations,
      },
    },
  });
}

export async function updateExperienceAction(id: string, data: ExperienceData) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { translations, ...experienceData } = data;

  await prisma.workExperienceTranslation.deleteMany({
    where: { workExperienceId: id },
  });

  return await prisma.workExperience.update({
    where: { id },
    data: {
      ...experienceData,
      translations: {
        create: translations,
      },
    },
  });
}

export async function deleteExperienceAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  return await prisma.workExperience.delete({
    where: { id },
  });
}

export async function exportDatabaseAction() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const [projects, blogs, profile, experiences, skills] = await Promise.all([
    prisma.project.findMany({
      include: { translations: true, technologies: true },
    }),
    prisma.blogPost.findMany({
      include: { translations: true },
    }),
    prisma.profile.findFirst({
      include: { translations: true },
    }),
    prisma.workExperience.findMany({
      include: { translations: true },
    }),
    prisma.skill.findMany(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    data: {
      projects,
      blogs,
      profile,
      experiences,
      skills,
    },
  };
}

export async function importDatabaseAction(jsonData: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const { data } = JSON.parse(jsonData);
  const { projects, blogs, profile, experiences, skills } = data;

  try {
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

      if (skills && skills.length > 0) {
        await tx.skill.createMany({
          data: (
            skills as { id: string; key: string; name: string; icon: string }[]
          ).map((s) => ({
            id: s.id,
            key: s.key,
            name: s.name,
            icon: s.icon,
          })),
        });
      }
      if (profile) {
        const p = profile as ProfileData;
        await tx.profile.create({
          data: {
            avatar: p.avatar,
            email: p.email,
            github: p.github,
            linkedin: p.linkedin,
            translations: {
              create: p.translations.map((t) => ({
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

      if (experiences && experiences.length > 0) {
        for (const exp of experiences as ExperienceData[]) {
          await tx.workExperience.create({
            data: {
              company: exp.company,
              logo: exp.logo,
              startDate: exp.startDate,
              endDate: exp.endDate,
              translations: {
                create: exp.translations.map((t) => ({
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

      if (blogs && blogs.length > 0) {
        for (const blog of blogs as BlogData[]) {
          await tx.blogPost.create({
            data: {
              slug: blog.slug,
              coverImage: blog.coverImage,
              featured: blog.featured,
              tags: blog.tags,
              translations: {
                create: blog.translations.map((t) => ({
                  language: t.language,
                  title: t.title,
                  description: t.description,
                  content: t.content,
                  readTime: t.readTime,
                  date: t.date,
                })),
              },
            },
          });
        }
      }

      if (projects && projects.length > 0) {
        for (const project of projects as ProjectData[]) {
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
                connect: (
                  project.technologies as unknown as { id: string }[]
                ).map((tech) => ({
                  id: tech.id, // Connect by ID since we restored skills with IDs
                })),
              },
              translations: {
                create: project.translations.map((t) => ({
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

    return { success: true };
  } catch (error) {
    console.error("Import error:", error);
    throw new Error("Import failed: " + (error as Error).message);
  }
}

export async function deleteCommentAction(id: string) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  return await prisma.comment.delete({
    where: { id },
  });
}
