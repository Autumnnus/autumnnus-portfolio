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
      orderBy: { startDate: "desc" },
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

export async function getAboutStats() {
  try {
    const projectCount = await prisma.project.count();

    // Find the earliest work experience start date
    // Note: startDate was recently added to schema
    const firstExperience = await prisma.workExperience.findFirst({
      where: {
        startDate: { not: null },
      },
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    });

    let experienceYears = 0;
    if (firstExperience?.startDate) {
      experienceYears =
        new Date().getFullYear() - firstExperience.startDate.getFullYear();
    } else {
      // Fallback to 2022 if no start date found (legacy behavior)
      experienceYears = new Date().getFullYear() - 2022;
    }

    return {
      projectCount,
      experienceYears,
    };
  } catch (error) {
    console.error("Failed to fetch about stats:", error);
    // Return safe defaults
    return {
      projectCount: 0,
      experienceYears: new Date().getFullYear() - 2022,
    };
  }
}

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getIpIdentifier() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "0.0.0.0";
}

export type CommentItemType = "blog" | "project";

export async function createComment(
  itemId: string,
  itemType: CommentItemType,
  content: string,
  authorName: string,
  authorEmail: string,
) {
  try {
    if (!content || content.trim().length === 0) {
      throw new Error("Comment content is required");
    }

    if (!authorName || authorName.trim().length === 0) {
      throw new Error("Name is required");
    }

    if (!authorEmail || authorEmail.trim().length === 0) {
      throw new Error("Email is required");
    }

    const ipAddress = await getIpIdentifier();

    // Rate limiting: Check if IP has posted recently
    const recentComments = await prisma.comment.count({
      where: {
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes
        },
      },
    });

    if (recentComments >= 3) {
      throw new Error("You are commenting too fast. Please try again later.");
    }

    const data: any = {
      content,
      authorName,
      authorEmail,
      ipAddress,
      approved: true,
    };

    if (itemType === "blog") {
      data.blogPostId = itemId;
    } else {
      data.projectId = itemId;
    }

    const comment = await prisma.comment.create({
      data,
    });

    const path =
      itemType === "blog"
        ? "/[locale]/blog/[slug]"
        : "/[locale]/projects/[slug]";
    revalidatePath(path, "layout");

    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Deprecated: kept for backward compatibility if needed, but redirects to new logic
export async function createCommentAction(blogPostId: string, content: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return createComment(
    blogPostId,
    "blog",
    content,
    session.user.name || "Anonymous",
    session.user.email,
  );
}

export async function getComments(
  itemId: string,
  itemType: CommentItemType,
  page: number = 1,
  limit: number = 20,
) {
  try {
    const skip = (page - 1) * limit;
    const where: any = {
      approved: true,
    };

    if (itemType === "blog") {
      where.blogPostId = itemId;
    } else {
      where.projectId = itemId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return {
      comments: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getCommentsAction(
  blogPostId: string,
  page: number = 1,
  limit: number = 20,
) {
  return getComments(blogPostId, "blog", page, limit);
}

export async function toggleLike(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();

    const where: any = {
      ipAddress,
    };

    if (itemType === "blog") {
      where.blogPostId = itemId;
    } else {
      where.projectId = itemId;
    }

    const existingLike = await prisma.like.findFirst({
      where,
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.like.create({
        data: where,
      });
    }

    // Get updated count
    const countWhere: any = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }

    const count = await prisma.like.count({ where: countWhere });

    const path =
      itemType === "blog"
        ? "/[locale]/blog/[slug]"
        : "/[locale]/projects/[slug]";
    revalidatePath(path, "layout");

    return { success: true, liked: !existingLike, count };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getLikeStatus(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();
    const where: any = {
      ipAddress,
    };

    if (itemType === "blog") {
      where.blogPostId = itemId;
    } else {
      where.projectId = itemId;
    }

    const like = await prisma.like.findFirst({ where });
    const countWhere: any = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }
    const count = await prisma.like.count({ where: countWhere });

    return { liked: !!like, count };
  } catch (error) {
    console.error("Failed to get like status:", error);
    return { liked: false, count: 0 };
  }
}

export async function incrementView(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();

    // Check if view already exists for this IP in the last 24 hours maybe?
    // Or just record every view but unique by session?
    // Requirements said: "ip bazlı proje ve blog kaç kere görüntülenmiş onu da tutalım"
    // Let's just create a view if not exists for this IP? Or generic increment?
    // "kaç kere görüntülenmiş" implies total views.
    // "ip bazlı" implies we track WHO viewed.
    // Let's just insert a record. Unique constraint is NOT on (ip, itemId) for Views in schema,
    // but typically valid views are once per session or day.
    // For simplicity and to avoid massive spam, let's limit 1 view per IP per hour or just checks existence?
    // Let's just Add it.

    // Check if viewed recently to avoid F5 spam
    const existingView = await prisma.view.findFirst({
      where: {
        ipAddress,
        ...(itemType === "blog"
          ? { blogPostId: itemId }
          : { projectId: itemId }),
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour
        },
      },
    });

    if (!existingView) {
      const data: any = {
        ipAddress,
      };
      if (itemType === "blog") {
        data.blogPostId = itemId;
      } else {
        data.projectId = itemId;
      }
      await prisma.view.create({ data });
    }

    const countWhere: any = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }
    const count = await prisma.view.count({ where: countWhere });

    return { success: true, count };
  } catch (error) {
    console.error("Failed to increment view:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getViewCount(itemId: string, itemType: CommentItemType) {
  try {
    const countWhere: any = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }
    return await prisma.view.count({ where: countWhere });
  } catch (error) {
    return 0;
  }
}
