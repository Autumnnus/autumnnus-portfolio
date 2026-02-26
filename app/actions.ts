"use server";

import { prisma } from "@/lib/prisma";
import { shouldNotify } from "@/lib/utils";
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
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords || [],
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

export async function getSocialLinks() {
  try {
    return await prisma.socialLink.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch social links", error);
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
  skipAuth = false,
}: {
  lang: Language;
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  featured?: boolean;
  skipAuth?: boolean;
}) {
  try {
    let isAdmin = false;

    if (!skipAuth) {
      try {
        const session = await auth();
        isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      } catch {
        isAdmin = false;
      }
    }

    const skip = (page - 1) * limit;

    const andConditions: Prisma.BlogPostWhereInput[] = [];

    if (!isAdmin) {
      andConditions.push({ status: "published" });
    }

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
        status: p.status,
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

export async function getBlogPostBySlug(
  slug: string,
  lang: Language,
  skipAuth = false,
) {
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

    let isAdmin = false;
    if (!skipAuth) {
      try {
        const session = await auth();
        isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      } catch {
        isAdmin = false;
      }
    }

    if (post.status === "draft" && !isAdmin) {
      return null;
    }

    const translation = post.translations[0] || {};
    return {
      ...post,
      title: translation.title || post.slug,
      description: translation.description || "",
      content: translation.content || "",
      readTime: translation.readTime || "",
      date: translation.date || "",
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords || [],
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
        quests: {
          include: {
            translations: {
              where: { language: lang },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!profile) return null;

    const translation = profile.translations[0] || {};
    return {
      ...profile,
      ...translation,
      quests: profile.quests.map((q) => ({
        id: q.id,
        completed: q.completed,
        order: q.order,
        label: q.translations[0]?.title || "",
      })),
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
    }

    const visitorCount = await prisma.uniqueVisitor.count();
    const blogCount = await prisma.blogPost.count();

    return {
      projectCount,
      experienceYears,
      visitorCount,
      blogCount,
    };
  } catch (error) {
    console.error("Failed to fetch about stats:", error);
    return {
      projectCount: 0,
      experienceYears: new Date().getFullYear() - 2022,
      visitorCount: 0,
      blogCount: 0,
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not defined in environment variables",
    );
  }
  return url;
};

async function getNotificationDetails(
  itemId: string,
  itemType: CommentItemType,
) {
  const baseUrl = getBaseUrl();
  let itemTitle = "Unknown";
  let itemLink = `${baseUrl}/${itemType === "blog" ? "blog" : "projects"}/${itemId}`;
  let coverImage = "";

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return "";
    let finalUrl = url;
    if (!url.startsWith("http")) {
      finalUrl = `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    }

    const baseHost = new URL(baseUrl).host;
    const isBasePublic =
      !baseHost.includes("localhost") && !baseHost.includes("127.0.0.1");

    if (
      isBasePublic &&
      (finalUrl.includes("localhost") || finalUrl.includes("127.0.0.1"))
    ) {
      finalUrl = finalUrl.replace(
        /(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/,
        `$1${baseHost}`,
      );
    }

    return finalUrl;
  };

  if (itemType === "blog") {
    const post = await prisma.blogPost.findUnique({
      where: { id: itemId },
      include: { translations: { take: 1 } },
    });
    if (post) {
      itemTitle = post.translations[0]?.title || post.slug;
      coverImage = ensureAbsoluteUrl(post.coverImage || "");
      itemLink = `${baseUrl}/blog/${post.slug}`;
    }
  } else {
    const project = await prisma.project.findUnique({
      where: { id: itemId },
      include: { translations: { take: 1 } },
    });
    if (project) {
      itemTitle = project.translations[0]?.title || project.slug;
      coverImage = ensureAbsoluteUrl(project.coverImage || "");
      itemLink = `${baseUrl}/projects/${project.slug}`;
    }
  }

  return {
    itemTitle,
    itemLink,
    coverImage,
  };
}

export async function createComment(
  itemId: string,
  itemType: CommentItemType,
  content: string,
  authorName: string,
  authorEmail: string,
  parentId?: string,
  turnstileToken?: string,
) {
  try {
    if (turnstileToken && !(await verifyTurnstileToken(turnstileToken))) {
      throw new Error("Security verification failed. Please try again.");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Comment content is required");
    }

    if (!authorName || authorName.trim().length === 0) {
      throw new Error("Name is required");
    }

    if (!authorEmail || authorEmail.trim().length === 0) {
      throw new Error("Email is required");
    }

    const session = await auth();
    const isAdmin =
      session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const ipAddress = await getIpIdentifier();

    if (!isAdmin) {
      const recentComments = await prisma.comment.count({
        where: {
          ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
      });
      if (recentComments >= 3) {
        throw new Error("You are commenting too fast. Please try again later.");
      }
    }

    const data: Prisma.CommentUncheckedCreateInput = {
      content,
      authorName,
      authorEmail,
      ipAddress,
      approved: true,
      isAdmin,
      parentId,
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

    if (!isAdmin) {
      await createAuditLog("COMMENT_CREATED", itemType.toUpperCase(), itemId, {
        authorName,
        commentId: comment.id,
        ipAddress,
      });

      const { itemTitle, itemLink, coverImage } = await getNotificationDetails(
        itemId,
        itemType,
      );

      let parentCommentText = "";
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
        });
        if (parent) {
          parentCommentText = `\n\nâ†©ï¸ <b>Replying to:</b> <i>"${escapeHtml(parent.authorName)}: ${escapeHtml(parent.content.substring(0, 50))}${parent.content.length > 50 ? "..." : ""}"</i>`;
        }
      }

      const telegramMessage =
        `<b>ğŸ’¬ New Comment on ${itemType === "blog" ? "Blog" : "Project"}</b>\n\n` +
        `ğŸ“ <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
        `ğŸ‘¤ <b>Author:</b> ${escapeHtml(authorName)}\n` +
        `ğŸ“§ <b>Email:</b> ${escapeHtml(authorEmail)}\n` +
        `ğŸ’¬ <b>Comment:</b>\n<i>"${escapeHtml(content)}"</i>` +
        parentCommentText +
        `\n\nğŸ”— <a href="${itemLink}">View on Website</a>`;

      await sendTelegramNotification(telegramMessage, coverImage);

      const commentCountWhere: Prisma.CommentWhereInput = {};
      if (itemType === "blog") {
        commentCountWhere.blogPostId = itemId;
      } else {
        commentCountWhere.projectId = itemId;
      }
      const totalComments = await prisma.comment.count({
        where: commentCountWhere,
      });

      if (shouldNotify(totalComments) && totalComments > 1) {
        await sendTelegramNotification(
          `💬 <b>Comment Milestone Reached!</b>\n\n` +
            `🚀 <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
            `📊 <b>Total Comments:</b> <code>${totalComments}</code>\n\n` +
            `🔗 <a href="${itemLink}">View Item</a>`,
          coverImage,
        );

        await createAuditLog(
          "COMMENT_MILESTONE",
          itemType.toUpperCase(),
          itemId,
          {
            milestone: totalComments,
          },
        );
      }
    }

    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!isAdmin) {
      throw new Error("Unauthorized");
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath("/[locale]/blog/[slug]", "layout");
    revalidatePath("/[locale]/projects/[slug]", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: (error as Error).message };
  }
}

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
    const where: Prisma.CommentWhereInput = {
      approved: true,
      parentId: null,
    };

    if (itemType === "blog") {
      where.blogPostId = itemId;
    } else {
      where.projectId = itemId;
    }

    const [comments, total, adminProfile] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
            where: { approved: true },
          },
        },
      }),
      prisma.comment.count({ where }),
      prisma.profile.findFirst({ select: { avatar: true } }),
    ]);

    const adminAvatar = adminProfile?.avatar || "";

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      adminAvatar,
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

    const where: Prisma.LikeWhereInput = {
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
        data: where as Prisma.LikeCreateInput,
      });
    }

    const countWhere: Prisma.LikeWhereInput = {};
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

    if (!existingLike) {
      if (shouldNotify(count)) {
        const { itemTitle, itemLink, coverImage } =
          await getNotificationDetails(itemId, itemType);

        await sendTelegramNotification(
          `❤️ <b>Like Milestone Reached!</b>\n\n` +
            `🚀 <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
            `📊 <b>Total Likes:</b> <code>${count}</code>\n\n` +
            `🔗 <a href="${itemLink}">View Item</a>`,
          coverImage,
        );

        await createAuditLog("LIKE_MILESTONE", itemType.toUpperCase(), itemId, {
          milestone: count,
          ipAddress,
        });
      }
    }

    await createAuditLog("LIKE_TOGGLED", itemType.toUpperCase(), itemId, {
      ipAddress,
      liked: !existingLike,
    });

    return { success: true, liked: !existingLike, count };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getLikeStatus(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();
    const where: Prisma.LikeWhereInput = {
      ipAddress,
    };

    if (itemType === "blog") {
      where.blogPostId = itemId;
    } else {
      where.projectId = itemId;
    }

    const like = await prisma.like.findFirst({ where });
    const countWhere: Prisma.LikeWhereInput = {};
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
    const countWhere: Prisma.ViewWhereInput = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }

    const existingView = await prisma.view.findFirst({
      where: {
        ipAddress,
        ...(itemType === "blog"
          ? { blogPostId: itemId }
          : { projectId: itemId }),
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      } as Prisma.ViewWhereInput,
    });

    if (!existingView) {
      const data: Prisma.ViewUncheckedCreateInput = {
        ipAddress,
      };
      if (itemType === "blog") {
        data.blogPostId = itemId;
      } else {
        data.projectId = itemId;
      }
      await prisma.view.create({ data });

      const count = await prisma.view.count({ where: countWhere });
      if (shouldNotify(count)) {
        const auditLogs = await prisma.auditLog.findMany({
          where: {
            action: "VIEW_MILESTONE",
            entityId: itemId,
            entityType: itemType.toUpperCase(),
          },
        });

        const hasNotifiedThisMilestone = auditLogs.some((log) => {
          const details = log.details as Record<string, unknown> | null;
          return details?.milestone === count;
        });

        if (!hasNotifiedThisMilestone) {
          const { itemTitle, itemLink, coverImage } =
            await getNotificationDetails(itemId, itemType);

          await sendTelegramNotification(
            `📈 <b>New View Milestone Reached!</b>\n\n` +
              `🚀 <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
              `📊 <b>Total Views:</b> <code>${count}</code>\n` +
              `✨ This ${itemType === "blog" ? "blog post" : "project"} just hit a new milestone!\n\n` +
              `🔗 <a href="${itemLink}">View on Website</a>`,
            coverImage,
          );

          await createAuditLog(
            "VIEW_MILESTONE",
            itemType.toUpperCase(),
            itemId,
            {
              milestone: count,
              ipAddress,
            },
          );
        }
      }
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
    const countWhere: Prisma.ViewWhereInput = {};
    if (itemType === "blog") {
      countWhere.blogPostId = itemId;
    } else {
      countWhere.projectId = itemId;
    }
    return await prisma.view.count({ where: countWhere });
  } catch {
    return 0;
  }
}

async function verifyTurnstileToken(token: string) {
  if (process.env.NODE_ENV === "development") return true;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY is missing");
    return true;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretKey, response: token }),
      },
    );
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}

async function sendTelegramNotification(message: string, photo?: string) {
  if (process.env.NODE_ENV === "development") return;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error("Telegram bot token or chat ID is missing");
    return;
  }

  try {
    const isPublicPhoto =
      photo &&
      photo.startsWith("http") &&
      !photo.includes("localhost") &&
      !photo.includes("127.0.0.1");
    const endpoint = isPublicPhoto ? "sendPhoto" : "sendMessage";

    const body: Record<string, unknown> = {
      chat_id: chatId,
      parse_mode: "HTML",
    };

    if (isPublicPhoto) {
      body.photo = photo;
      body.caption = message;
    } else {
      body.text = message;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
    }
  } catch (error) {
    console.error("Telegram notification failed:", error);
  }
}

async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  details: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({
      data: { action, entityType, entityId, details },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function trackVisitor() {
  try {
    const ipAddress = await getIpIdentifier();

    if (ipAddress === "0.0.0.0") return { success: false };

    const existing = await prisma.uniqueVisitor.findUnique({
      where: { ipAddress },
    });

    if (!existing) {
      await prisma.uniqueVisitor.create({
        data: { ipAddress },
      });

      const totalUniqueVisitors = await prisma.uniqueVisitor.count();

      if (shouldNotify(totalUniqueVisitors)) {
        const baseUrl = getBaseUrl();

        type TierInfo = {
          autumn: string;
          winter: string;
          icon: string;
          desc: string;
        };
        const TIERS: Record<number, TierInfo> = {
          100: {
            autumn: "Amber",
            winter: "Frozen Trail",
            icon: "🍂",
            desc: "İlk adımlar atıldı, yapraklar rüzgarla dans etmeye başladı.",
          },
          500: {
            autumn: "Harvest Wind",
            winter: "Blizzard",
            icon: "🌪️",
            desc: "Rüzgar hızlanıyor. Ziyaretçiler akın ediyor!",
          },
          1000: {
            autumn: "Golden Oak",
            winter: "Ice Crystal",
            icon: "💎",
            desc: "Binlerce kök salındı. Buz kristalleri kadar parlak bir kilometre taşı!",
          },
          2500: {
            autumn: "Crimson Forest",
            winter: "Aurora",
            icon: "✨",
            desc: "Orman kızıla büründü, gökyüzünü kuzey ışıkları aydınlatıyor. Ne muazzam bir kalabalık!",
          },
          5000: {
            autumn: "Autumn Storm",
            winter: "Glacier",
            icon: "⚡",
            desc: "Kudretli bir fırtına, görkemli bir buzul! Adeta durdurulamaz bir güç.",
          },
          10000: {
            autumn: "Phoenix",
            winter: "Polar Star",
            icon: "🔥",
            desc: "Küllerinden doğan bir anka, kutup yıldızı kadar parlak on bin ziyaretçi!",
          },
          25000: {
            autumn: "Season Lord",
            winter: "Eternal Winter",
            icon: "👑",
            desc: "Sen artık mevsimlerin efendisisin! Sonsuz kışın hükümdarlığı başlasın.",
          },
        };

        const tier = TIERS[totalUniqueVisitors];
        let telegramMessage = "";

        if (tier) {
          telegramMessage =
            `🎉 <b>WOW! Yeni Bir Tier Kilidi Açıldı!</b> ${tier.icon}\n\n` +
            `🍁 <b>Güz:</b> ${tier.autumn}\n` +
            `❄️ <b>Kış:</b> ${tier.winter}\n\n` +
            `<i>"${tier.desc}"</i>\n\n` +
            `👥 <b>Toplam Ziyaretçi:</b> <code>${totalUniqueVisitors}</code>\n` +
            `📍 <b>Son Gelen IP:</b> ${escapeHtml(ipAddress)}\n\n` +
            `🔗 <a href="${baseUrl}">Portfolyoya Git</a>`;
        } else {
          telegramMessage =
            `🎉 <b>Yeni Ziyaretçi Kilometre Taşı!</b>\n\n` +
            `👋 <b>Toplam Ziyaretçi:</b> <code>${totalUniqueVisitors}</code>\n` +
            `📍 <b>Son Gelen IP:</b> ${escapeHtml(ipAddress)}\n\n` +
            `🔗 <a href="${baseUrl}">Portfolyoyu İncele</a>`;
        }

        await sendTelegramNotification(telegramMessage);

        await createAuditLog("VISITOR_MILESTONE", "SYSTEM", "GLOBAL", {
          milestone: totalUniqueVisitors,
          ipAddress,
        });

        try {
          await prisma.visitorMilestone.upsert({
            where: { count: totalUniqueVisitors },
            update: {},
            create: { count: totalUniqueVisitors },
          });
        } catch (e) {
          console.error("Failed to record visitor milestone:", e);
        }
      }

      revalidatePath("/", "layout");
      return { success: true, count: totalUniqueVisitors, isNew: true };
    }

    return { success: true, isNew: false };
  } catch (error) {
    console.error("Failed to track visitor:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getVisitorMilestones() {
  try {
    return await prisma.visitorMilestone.findMany({
      orderBy: { count: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch visitor milestones:", error);
    return [];
  }
}

export async function getSimilarProjects(
  projectId: string,
  lang: Language,
  limit: number = 2,
) {
  try {
    const targetLanguage = lang === "tr" ? "tr" : "en";
    type RawResult = { sourceId: string; distance: number };

    let similarProjectIds: RawResult[] = [];

    try {
      similarProjectIds = await prisma.$queryRaw<RawResult[]>`
        WITH SourceEmbedding AS (
          SELECT embedding 
          FROM "Embedding" 
          WHERE "sourceType" = 'project' 
            AND "sourceId" = ${projectId} 
            AND "language" = ${targetLanguage} 
          ORDER BY "chunkIndex" ASC 
          LIMIT 1
        )
        SELECT "sourceId", MIN(embedding <=> (SELECT embedding FROM SourceEmbedding)) as distance
        FROM "Embedding"
        WHERE "sourceType" = 'project'
          AND "language" = ${targetLanguage}
          AND "sourceId" != ${projectId}
          AND (SELECT embedding FROM SourceEmbedding) IS NOT NULL
        GROUP BY "sourceId"
        ORDER BY distance ASC
        LIMIT ${limit}
      `;
    } catch (e) {
      console.error("Project similarity search failed:", e);
    }

    if (
      !similarProjectIds.length ||
      similarProjectIds.every((r) => r.distance === null)
    ) {
      const fallbackProjects = await prisma.project.findMany({
        where: { id: { not: projectId } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          translations: { where: { language: lang } },
          technologies: true,
        },
      });

      return fallbackProjects.map((p) => {
        const translation = p.translations[0] || {};
        return {
          ...p,
          title: translation.title || p.slug,
          shortDescription: translation.shortDescription || "",
          fullDescription: translation.fullDescription || "",
        };
      });
    }

    const ids = similarProjectIds.map((r) => r.sourceId);

    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      include: {
        translations: { where: { language: lang } },
        technologies: true,
      },
    });

    // Sort projects to match the similarity order
    return ids
      .map((id) => {
        const p = projects.find((proj) => proj.id === id);
        if (!p) return null;
        const translation = p.translations[0] || {};
        return {
          ...p,
          title: translation.title || p.slug,
          shortDescription: translation.shortDescription || "",
          fullDescription: translation.fullDescription || "",
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch similar projects:", error);
    return [];
  }
}

export async function getSimilarBlogPosts(
  blogPostId: string,
  lang: Language,
  limit: number = 2,
) {
  try {
    const targetLanguage = lang === "tr" ? "tr" : "en";
    type RawResult = { sourceId: string; distance: number };

    let similarBlogIds: RawResult[] = [];

    try {
      similarBlogIds = await prisma.$queryRaw<RawResult[]>`
        WITH SourceEmbedding AS (
          SELECT embedding 
          FROM "Embedding" 
          WHERE "sourceType" = 'blog' 
            AND "sourceId" = ${blogPostId} 
            AND "language" = ${targetLanguage} 
          ORDER BY "chunkIndex" ASC 
          LIMIT 1
        )
        SELECT "sourceId", MIN(embedding <=> (SELECT embedding FROM SourceEmbedding)) as distance
        FROM "Embedding"
        WHERE "sourceType" = 'blog'
          AND "language" = ${targetLanguage}
          AND "sourceId" != ${blogPostId}
          AND (SELECT embedding FROM SourceEmbedding) IS NOT NULL
        GROUP BY "sourceId"
        ORDER BY distance ASC
        LIMIT ${limit}
      `;
    } catch (e) {
      console.error("Blog similarity search failed:", e);
    }

    if (
      !similarBlogIds.length ||
      similarBlogIds.every((r) => r.distance === null)
    ) {
      const fallbackPosts = await prisma.blogPost.findMany({
        where: {
          id: { not: blogPostId },
          status: "published",
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          translations: { where: { language: lang } },
        },
      });

      return fallbackPosts.map((p) => {
        const translation = p.translations[0] || {};
        return {
          ...p,
          title: translation.title || p.slug,
          description: translation.description || "",
          content: translation.content || "",
          readTime: translation.readTime || "",
          date: translation.date || "",
          status: p.status,
        };
      });
    }

    const ids = similarBlogIds.map((r) => r.sourceId);

    const posts = await prisma.blogPost.findMany({
      where: {
        id: { in: ids },
        status: "published", // Always restrict similar posts to published
      },
      include: {
        translations: { where: { language: lang } },
      },
    });

    return ids
      .map((id) => {
        const p = posts.find((post) => post.id === id);
        if (!p) return null;
        const translation = p.translations[0] || {};
        return {
          ...p,
          title: translation.title || p.slug,
          description: translation.description || "",
          content: translation.content || "",
          readTime: translation.readTime || "",
          date: translation.date || "",
          status: p.status,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch similar blog posts:", error);
    return [];
  }
}
