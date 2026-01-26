"use server";

import { prisma } from "@/lib/prisma";
import { Language, Prisma } from "@prisma/client";

export interface GetProjectsOptions {
  lang: Language;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  featured?: boolean;
}

export async function getProjects({
  lang,
  page = 1,
  limit = 6,
  search = "",
  status = "All",
  category = "All",
  featured,
}: GetProjectsOptions) {
  try {
    const skip = (page - 1) * limit;

    const andConditions: Prisma.ProjectWhereInput[] = [];

    if (featured !== undefined) {
      andConditions.push({ featured });
    }

    if (status !== "All") {
      andConditions.push({ status });
    }

    if (category !== "All") {
      andConditions.push({ category });
    }

    if (search) {
      andConditions.push({
        OR: [
          {
            translations: {
              some: {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  {
                    shortDescription: { contains: search, mode: "insensitive" },
                  },
                ],
              },
            },
          },
          {
            technologies: {
              some: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.ProjectWhereInput = {
      AND: andConditions,
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          translations: {
            where: { language: lang },
          },
          technologies: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    const items = projects.map((p) => {
      const translation = p.translations[0] || {};
      return {
        ...p,
        title: translation.title || p.slug,
        shortDescription: translation.shortDescription || "",
        fullDescription: translation.fullDescription || "",
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getProjectById(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        translations: true,
        technologies: true,
      },
    });
    return project;
  } catch (error) {
    console.error(`Failed to fetch project by id ${id}:`, error);
    return null;
  }
}

export async function getProjectBySlug(slug: string, lang: Language) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        translations: {
          where: { language: lang },
        },
        technologies: true,
      },
    });

    if (!project) return null;

    const translation = project.translations[0] || {};
    return {
      ...project,
      title: translation.title || project.slug,
      shortDescription: translation.shortDescription || "",
      fullDescription: translation.fullDescription || "",
    };
  } catch (error) {
    console.error(`Failed to fetch project by slug ${slug}:`, error);
    return null;
  }
}

export async function getSkills() {
  try {
    return await prisma.skill.findMany();
  } catch (error) {
    console.error("Failed to fetch skills", error);
    return [];
  }
}

export async function getProjectFilters() {
  try {
    const [statuses, categories] = await Promise.all([
      prisma.project.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.project.groupBy({
        by: ["category"],
        _count: { category: true },
      }),
    ]);

    return {
      statuses: statuses.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      categories: categories.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch project filters:", error);
    return { statuses: [], categories: [] };
  }
}

export async function getBlogPosts({
  lang,
  page = 1,
  limit = 6,
  search = "",
  tag = "All",
  featured,
}: {
  lang: Language;
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  featured?: boolean;
}) {
  try {
    const skip = (page - 1) * limit;

    const andConditions: Prisma.BlogPostWhereInput[] = [];

    if (featured !== undefined) {
      andConditions.push({ featured });
    }

    if (tag !== "All") {
      andConditions.push({ tags: { has: tag } });
    }

    if (search) {
      andConditions.push({
        translations: {
          some: {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      });
    }

    const where: Prisma.BlogPostWhereInput = {
      AND: andConditions,
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: {
            where: { language: lang },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const items = posts.map((p) => {
      const translation = p.translations[0] || {};
      return {
        ...p,
        title: translation.title || p.slug,
        description: translation.description || "",
        content: translation.content || "",
        readTime: translation.readTime || "",
        date: translation.date || "",
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getBlogPostById(id: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });
    return post;
  } catch (error) {
    console.error(`Failed to fetch blog post by id ${id}:`, error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string, lang: Language) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        translations: {
          where: { language: lang },
        },
      },
    });

    if (!post) return null;

    const translation = post.translations[0] || {};
    return {
      ...post,
      title: translation.title || post.slug,
      description: translation.description || "",
      content: translation.content || "",
      readTime: translation.readTime || "",
      date: translation.date || "",
    };
  } catch (error) {
    console.error(`Failed to fetch blog post by slug ${slug}:`, error);
    return null;
  }
}

export async function getBlogFilters() {
  try {
    const posts = await prisma.blogPost.findMany({
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return {
      tags: Array.from(tagCounts.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch blog filters:", error);
    return { tags: [] };
  }
}
export async function getProfile(lang: Language) {
  try {
    const profile = await prisma.profile.findFirst({
      include: {
        translations: {
          where: { language: lang },
        },
      },
    });

    if (!profile) return null;

    const translation = profile.translations[0] || {};
    return {
      ...profile,
      ...translation,
    };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}

export async function getWorkExperiences(lang: Language) {
  try {
    const experiences = await prisma.workExperience.findMany({
      include: {
        translations: {
          where: { language: lang },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return experiences.map((exp) => {
      const translation = exp.translations[0] || {};
      return {
        ...exp,
        ...translation,
      };
    });
  } catch (error) {
    console.error("Failed to fetch work experiences:", error);
    return [];
  }
}
