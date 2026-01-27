"use server";

import { auth } from "@/auth";
import { deleteFolder, uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

interface ProjectTranslationInput {
  language: "tr" | "en";
  title: string;
  shortDescription: string;
  fullDescription: string;
}

interface ProjectData {
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

interface BlogTranslationInput {
  language: "tr" | "en";
  title: string;
  description: string;
  content: string;
}

interface BlogData {
  slug: string;
  coverImage?: string | null;
  featured: boolean;
  tags: string[];
  translations: BlogTranslationInput[];
}

interface ProfileTranslationInput {
  language: "tr" | "en";
  name: string;
  title: string;
  greetingText: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
}

interface ProfileData {
  avatar: string;
  email: string;
  github: string;
  linkedin: string;
  translations: ProfileTranslationInput[];
}

interface ExperienceTranslationInput {
  language: "tr" | "en";
  role: string;
  description: string;
  locationType: string;
}

interface ExperienceData {
  company: string;
  logo: string;
  startDate?: Date | null;
  endDate?: Date | null;
  translations: ExperienceTranslationInput[];
}

export async function uploadImageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  const customPath = formData.get("path") as string; // e.g., "projects/my-slug" or "skills"

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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  // Check if slug already exists
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const { translations, technologies, images, ...projectData } = data;

  // Check if slug exists in another project
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

  // Update logic: simpler to delete translations and recreate or update specifically
  // For simplicity here, we update translations one by one or delete/create
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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

// Blog Actions
export async function createBlogAction(data: BlogData) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  // Check if slug already exists
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const { translations, ...blogData } = data;

  // Check if slug exists in another blog post
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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

// Skill Actions
export async function createSkillAction(data: { name: string; icon: string }) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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
// Profile Actions
export async function updateProfileAction(data: ProfileData) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
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
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  return await prisma.workExperience.delete({
    where: { id },
  });
}
