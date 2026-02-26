"use server";

import { db } from "@/lib/db";
import {
  _projectToSkill,
  auditLog,
  blogPost,
  blogPostTranslation,
  comment,
  LanguageType as Language,
  like,
  profileTranslation,
  project,
  projectTranslation,
  quest,
  questTranslation,
  skill,
  socialLink,
  uniqueVisitor,
  view,
  visitorMilestone,
  workExperience,
  workExperienceTranslation,
} from "@/lib/db/schema";
import { shouldNotify } from "@/lib/utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";

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

    const filters = [];

    if (featured !== undefined) {
      filters.push(eq(project.featured, featured));
    }

    if (status !== "All") {
      filters.push(eq(project.status, status));
    }

    if (category !== "All") {
      filters.push(eq(project.category, category));
    }

    if (search) {
      // Find project IDs matching translation search
      const matchingTranslations = await db
        .select({ projectId: projectTranslation.projectId })
        .from(projectTranslation)
        .where(
          or(
            ilike(projectTranslation.title, `%${search}%`),
            ilike(projectTranslation.shortDescription, `%${search}%`),
          ),
        );

      const matchingSkills = await db
        .select({ projectId: _projectToSkill.A })
        .from(_projectToSkill)
        .innerJoin(skill, eq(_projectToSkill.B, skill.id))
        .where(ilike(skill.name, `%${search}%`));

      const matchingIds = [
        ...new Set([
          ...matchingTranslations.map((t) => t.projectId),
          ...matchingSkills.map((s) => s.projectId),
        ]),
      ];

      if (matchingIds.length === 0) {
        // No matches across translations or skills
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      filters.push(inArray(project.id, matchingIds));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(project)
      .where(whereClause);

    const total = totalResult.count;

    const projectsRes = await db.query.project.findMany({
      where: whereClause,
      with: {
        translations: {
          where: eq(projectTranslation.language, lang),
        },
        technologies: {
          with: { skill: true },
        },
      },
      orderBy: [desc(project.createdAt)],
      offset: skip,
      limit,
    });

    const items = projectsRes.map((p) => {
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
    const prj = await db.query.project.findFirst({
      where: eq(project.id, id),
      with: {
        translations: true,
        technologies: { with: { skill: true } },
      },
    });
    if (!prj) return null;
    return {
      ...prj,
      technologies: prj.technologies.map((t) => t.skill),
    };
  } catch (error) {
    console.error(`Failed to fetch project by id ${id}:`, error);
    return null;
  }
}

export async function getProjectBySlug(slugStr: string, lang: Language) {
  try {
    const prj = await db.query.project.findFirst({
      where: eq(project.slug, slugStr),
      with: {
        translations: {
          where: eq(projectTranslation.language, lang),
        },
        technologies: { with: { skill: true } },
      },
    });

    if (!prj) return null;

    const translation = prj.translations[0] || {};
    return {
      ...prj,
      title: translation.title || prj.slug,
      shortDescription: translation.shortDescription || "",
      fullDescription: translation.fullDescription || "",
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      keywords: translation.keywords || [],
    };
  } catch (error) {
    console.error(`Failed to fetch project by slug ${slugStr}:`, error);
    return null;
  }
}

export async function getSkills() {
  try {
    return await db.select().from(skill);
  } catch (error) {
    console.error("Failed to fetch skills", error);
    return [];
  }
}

export async function getSocialLinks() {
  try {
    return await db.select().from(socialLink).orderBy(asc(socialLink.name));
  } catch (error) {
    console.error("Failed to fetch social links", error);
    return [];
  }
}

export async function getProjectFilters() {
  try {
    const statuses = await db
      .select({ status: project.status, count: count() })
      .from(project)
      .groupBy(project.status);

    const categories = await db
      .select({ category: project.category, count: count() })
      .from(project)
      .groupBy(project.category);

    return {
      statuses: statuses.map((s) => ({
        status: s.status,
        count: s.count,
      })),
      categories: categories.map((c) => ({
        category: c.category,
        count: c.count,
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

    const filters = [];

    if (!isAdmin) {
      filters.push(eq(blogPost.status, "published"));
    }

    if (featured !== undefined) {
      filters.push(eq(blogPost.featured, featured));
    }

    if (tag !== "All") {
      filters.push(sql`${blogPost.tags} @> ARRAY[${tag}]::text[]`);
    }

    if (search) {
      const matchingTranslations = await db
        .select({ blogPostId: blogPostTranslation.blogPostId })
        .from(blogPostTranslation)
        .where(
          or(
            ilike(blogPostTranslation.title, `%${search}%`),
            ilike(blogPostTranslation.description, `%${search}%`),
          ),
        );

      const matchingIds = matchingTranslations.map((t) => t.blogPostId);

      if (matchingIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      filters.push(inArray(blogPost.id, matchingIds));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(blogPost)
      .where(whereClause);

    const total = totalResult.count;

    const posts = await db.query.blogPost.findMany({
      where: whereClause,
      with: {
        translations: {
          where: eq(blogPostTranslation.language, lang),
        },
      },
      orderBy: [desc(blogPost.createdAt)],
      offset: skip,
      limit,
    });

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
    const post = await db.query.blogPost.findFirst({
      where: eq(blogPost.id, id),
      with: {
        translations: true,
      },
    });
    return post || null;
  } catch (error) {
    console.error(`Failed to fetch blog post by id ${id}:`, error);
    return null;
  }
}

export async function getBlogPostBySlug(
  slugStr: string,
  lang: Language,
  skipAuth = false,
) {
  try {
    const post = await db.query.blogPost.findFirst({
      where: eq(blogPost.slug, slugStr),
      with: {
        translations: {
          where: eq(blogPostTranslation.language, lang),
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
    console.error(`Failed to fetch blog post by slug ${slugStr}:`, error);
    return null;
  }
}

export async function getBlogFilters() {
  try {
    const posts = await db.select({ tags: blogPost.tags }).from(blogPost);

    const tagCounts = new Map<string, number>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
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
    const prof = await db.query.profile.findFirst({
      with: {
        translations: {
          where: eq(profileTranslation.language, lang),
        },
        quests: {
          with: {
            translations: {
              where: eq(questTranslation.language, lang),
            },
          },
          orderBy: [asc(quest.order)],
        },
      },
    });

    if (!prof) return null;

    const translation = prof.translations[0] || {};
    return {
      ...prof,
      ...translation,
      quests: prof.quests.map((q) => ({
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
    const experiences = await db.query.workExperience.findMany({
      with: {
        translations: {
          where: eq(workExperienceTranslation.language, lang),
        },
      },
      orderBy: [desc(workExperience.startDate)],
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
    const [projectCountRes] = await db.select({ count: count() }).from(project);
    const projectCount = projectCountRes.count;

    const firstExperience = await db.query.workExperience.findFirst({
      where: sql`${workExperience.startDate} IS NOT NULL`,
      orderBy: [asc(workExperience.startDate)],
    });

    let experienceYears = 0;
    if (firstExperience?.startDate) {
      experienceYears =
        new Date().getFullYear() -
        new Date(firstExperience.startDate).getFullYear();
    }

    const [visitorCountRes] = await db
      .select({ count: count() })
      .from(uniqueVisitor);
    const visitorCount = visitorCountRes.count;

    const [blogCountRes] = await db.select({ count: count() }).from(blogPost);
    const blogCount = blogCountRes.count;

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
    const post = await db.query.blogPost.findFirst({
      where: eq(blogPost.id, itemId),
      with: { translations: { limit: 1 } },
    });
    if (post) {
      itemTitle = post.translations[0]?.title || post.slug;
      coverImage = ensureAbsoluteUrl(post.coverImage || "");
      itemLink = `${baseUrl}/blog/${post.slug}`;
    }
  } else {
    const prj = await db.query.project.findFirst({
      where: eq(project.id, itemId),
      with: { translations: { limit: 1 } },
    });
    if (prj) {
      itemTitle = prj.translations[0]?.title || prj.slug;
      coverImage = ensureAbsoluteUrl(prj.coverImage || "");
      itemLink = `${baseUrl}/projects/${prj.slug}`;
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
  contentStr: string,
  authorName: string,
  authorEmail: string,
  parentId?: string,
  turnstileToken?: string,
) {
  try {
    if (turnstileToken && !(await verifyTurnstileToken(turnstileToken))) {
      throw new Error("Security verification failed. Please try again.");
    }

    if (!contentStr || contentStr.trim().length === 0) {
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
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const [{ count: recentComments }] = await db
        .select({ count: count() })
        .from(comment)
        .where(
          and(
            eq(comment.ipAddress, ipAddress),
            gte(comment.createdAt, tenMinsAgo),
          ),
        );

      if (recentComments >= 3) {
        throw new Error("You are commenting too fast. Please try again later.");
      }
    }

    const data: typeof comment.$inferInsert = {
      content: contentStr,
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

    const [newComment] = await db.insert(comment).values(data).returning();

    const path =
      itemType === "blog"
        ? "/[locale]/blog/[slug]"
        : "/[locale]/projects/[slug]";
    revalidatePath(path, "layout");

    if (!isAdmin) {
      await createAuditLog("COMMENT_CREATED", itemType.toUpperCase(), itemId, {
        authorName,
        commentId: newComment.id,
        ipAddress,
      });

      const { itemTitle, itemLink, coverImage } = await getNotificationDetails(
        itemId,
        itemType,
      );

      let parentCommentText = "";
      if (parentId) {
        const parent = await db.query.comment.findFirst({
          where: eq(comment.id, parentId),
        });
        if (parent) {
          parentCommentText = `\n\nâ†©ï¸  <b>Replying to:</b> <i>"${escapeHtml(parent.authorName)}: ${escapeHtml(parent.content.substring(0, 50))}${parent.content.length > 50 ? "..." : ""}"</i>`;
        }
      }

      const telegramMessage =
        `<b>ğŸ’¬ New Comment on ${itemType === "blog" ? "Blog" : "Project"}</b>\n\n` +
        `ğŸ“  <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
        `ğŸ‘¤ <b>Author:</b> ${escapeHtml(authorName)}\n` +
        `ğŸ“§ <b>Email:</b> ${escapeHtml(authorEmail)}\n` +
        `ğŸ’¬ <b>Comment:</b>\n<i>"${escapeHtml(contentStr)}"</i>` +
        parentCommentText +
        `\n\nğŸ”— <a href="${itemLink}">View on Website</a>`;

      await sendTelegramNotification(telegramMessage, coverImage);

      const commentCountWhere =
        itemType === "blog"
          ? eq(comment.blogPostId, itemId)
          : eq(comment.projectId, itemId);

      const [{ count: totalComments }] = await db
        .select({ count: count() })
        .from(comment)
        .where(commentCountWhere);

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

    return { success: true, comment: newComment };
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

    await db.delete(comment).where(eq(comment.id, commentId));

    revalidatePath("/[locale]/blog/[slug]", "layout");
    revalidatePath("/[locale]/projects/[slug]", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createCommentAction(
  blogPostId: string,
  contentStr: string,
) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return createComment(
    blogPostId,
    "blog",
    contentStr,
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

    const filters = [
      eq(comment.approved, true),
      sql`${comment.parentId} IS NULL`,
    ];

    if (itemType === "blog") {
      filters.push(eq(comment.blogPostId, itemId));
    } else {
      filters.push(eq(comment.projectId, itemId));
    }

    const whereClause = and(...filters);

    const [totalResult] = await db
      .select({ count: count() })
      .from(comment)
      .where(whereClause);

    const total = totalResult.count;

    const commentsList = await db.query.comment.findMany({
      where: whereClause,
      orderBy: [desc(comment.createdAt)],
      offset: skip,
      limit,
      with: {
        replies: {
          where: eq(comment.approved, true),
          orderBy: [asc(comment.createdAt)],
        },
      },
    });

    const adminProfile = await db.query.profile.findFirst({
      columns: { avatar: true },
    });

    const adminAvatar = adminProfile?.avatar || "";

    return {
      comments: commentsList,
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

    const filters = [eq(like.ipAddress, ipAddress)];
    if (itemType === "blog") {
      filters.push(eq(like.blogPostId, itemId));
    } else {
      filters.push(eq(like.projectId, itemId));
    }
    const existingLike = await db.query.like.findFirst({
      where: and(...filters),
    });

    if (existingLike) {
      await db.delete(like).where(eq(like.id, existingLike.id));
    } else {
      const data: typeof like.$inferInsert = { ipAddress };
      if (itemType === "blog") {
        data.blogPostId = itemId;
      } else {
        data.projectId = itemId;
      }
      await db.insert(like).values(data);
    }

    const countFilters = [];
    if (itemType === "blog") {
      countFilters.push(eq(like.blogPostId, itemId));
    } else {
      countFilters.push(eq(like.projectId, itemId));
    }

    const [{ count: totalLikes }] = await db
      .select({ count: count() })
      .from(like)
      .where(and(...countFilters));

    const path =
      itemType === "blog"
        ? "/[locale]/blog/[slug]"
        : "/[locale]/projects/[slug]";
    revalidatePath(path, "layout");

    if (!existingLike) {
      if (shouldNotify(totalLikes)) {
        const { itemTitle, itemLink, coverImage } =
          await getNotificationDetails(itemId, itemType);

        await sendTelegramNotification(
          `❤️ <b>Like Milestone Reached!</b>\n\n` +
            `🚀 <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
            `📊 <b>Total Likes:</b> <code>${totalLikes}</code>\n\n` +
            `🔗 <a href="${itemLink}">View Item</a>`,
          coverImage,
        );

        await createAuditLog("LIKE_MILESTONE", itemType.toUpperCase(), itemId, {
          milestone: totalLikes,
          ipAddress,
        });
      }
    }

    await createAuditLog("LIKE_TOGGLED", itemType.toUpperCase(), itemId, {
      ipAddress,
      liked: !existingLike,
    });

    return { success: true, liked: !existingLike, count: totalLikes };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getLikeStatus(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();

    const countFilters = [];
    if (itemType === "blog") {
      countFilters.push(eq(like.blogPostId, itemId));
    } else {
      countFilters.push(eq(like.projectId, itemId));
    }

    const [{ count: totalLikes }] = await db
      .select({ count: count() })
      .from(like)
      .where(and(...countFilters));

    let isLiked = false;

    if (ipAddress !== "0.0.0.0") {
      const filters = [eq(like.ipAddress, ipAddress)];
      if (itemType === "blog") {
        filters.push(eq(like.blogPostId, itemId));
      } else {
        filters.push(eq(like.projectId, itemId));
      }

      const existingLike = await db.query.like.findFirst({
        where: and(...filters),
      });
      isLiked = !!existingLike;
    }

    return { liked: isLiked, count: totalLikes };
  } catch (error) {
    console.error("Failed to get like status:", error);
    return { liked: false, count: 0 };
  }
}

export async function incrementView(itemId: string, itemType: CommentItemType) {
  try {
    const ipAddress = await getIpIdentifier();

    // Check recent view
    const filters = [eq(view.ipAddress, ipAddress)];
    if (itemType === "blog") {
      filters.push(eq(view.blogPostId, itemId));
    } else {
      filters.push(eq(view.projectId, itemId));
    }

    const existingRecentView = await db.query.view.findFirst({
      where: and(
        ...filters,
        gte(view.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    });

    let totalViews = 0;

    if (!existingRecentView) {
      const data: typeof view.$inferInsert = { ipAddress };
      if (itemType === "blog") {
        data.blogPostId = itemId;
      } else {
        data.projectId = itemId;
      }

      await db.insert(view).values(data);

      const countFilters = [];
      if (itemType === "blog") {
        countFilters.push(eq(view.blogPostId, itemId));
      } else {
        countFilters.push(eq(view.projectId, itemId));
      }
      const [{ count: c }] = await db
        .select({ count: count() })
        .from(view)
        .where(and(...countFilters));

      totalViews = c;

      if (shouldNotify(totalViews)) {
        const auditLogs = await db.query.auditLog.findMany({
          where: and(
            eq(auditLog.action, "VIEW_MILESTONE"),
            eq(auditLog.entityId, itemId),
            eq(auditLog.entityType, itemType.toUpperCase()),
          ),
        });

        const hasNotifiedThisMilestone = auditLogs.some((l) => {
          const det = l.details as Record<string, unknown> | null;
          return det?.milestone === totalViews;
        });

        if (!hasNotifiedThisMilestone) {
          const { itemTitle, itemLink, coverImage } =
            await getNotificationDetails(itemId, itemType);

          await sendTelegramNotification(
            `📈 <b>New View Milestone Reached!</b>\n\n` +
              `🚀 <b>Item:</b> ${escapeHtml(itemTitle)}\n` +
              `📊 <b>Total Views:</b> <code>${totalViews}</code>\n` +
              `✨ This ${itemType === "blog" ? "blog post" : "project"} just hit a new milestone!\n\n` +
              `🔗 <a href="${itemLink}">View on Website</a>`,
            coverImage,
          );

          await createAuditLog(
            "VIEW_MILESTONE",
            itemType.toUpperCase(),
            itemId,
            {
              milestone: totalViews,
              ipAddress,
            },
          );
        }
      }
    } else {
      const countFilters = [];
      if (itemType === "blog") {
        countFilters.push(eq(view.blogPostId, itemId));
      } else {
        countFilters.push(eq(view.projectId, itemId));
      }
      const [{ count: c }] = await db
        .select({ count: count() })
        .from(view)
        .where(and(...countFilters));
      totalViews = c;
    }

    return { success: true, count: totalViews };
  } catch (error) {
    console.error("Failed to increment view:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getViewCount(itemId: string, itemType: CommentItemType) {
  try {
    const countFilters = [];
    if (itemType === "blog") {
      countFilters.push(eq(view.blogPostId, itemId));
    } else {
      countFilters.push(eq(view.projectId, itemId));
    }

    const [{ count: totalViews }] = await db
      .select({ count: count() })
      .from(view)
      .where(and(...countFilters));

    return totalViews;
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
  actionArg: string,
  entityTypeArg: string,
  entityIdArg: string,
  detailsArg: Record<string, unknown>,
) {
  try {
    await db.insert(auditLog).values({
      action: actionArg,
      entityType: entityTypeArg,
      entityId: entityIdArg,
      details: detailsArg,
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function trackVisitor() {
  try {
    const ipAddress = await getIpIdentifier();

    if (ipAddress === "0.0.0.0") return { success: false };

    const existing = await db.query.uniqueVisitor.findFirst({
      where: eq(uniqueVisitor.ipAddress, ipAddress),
    });

    if (!existing) {
      await db.insert(uniqueVisitor).values({
        ipAddress,
      });

      const [{ count: totalUniqueVisitors }] = await db
        .select({ count: count() })
        .from(uniqueVisitor);

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
          // Check if milestone exists
          const existingMilestone = await db.query.visitorMilestone.findFirst({
            where: eq(visitorMilestone.count, totalUniqueVisitors),
          });

          if (!existingMilestone) {
            await db
              .insert(visitorMilestone)
              .values({ count: totalUniqueVisitors });
          }
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
    return await db.query.visitorMilestone.findMany({
      orderBy: [asc(visitorMilestone.count)],
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
      const res = await db.execute<RawResult>(sql`
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
      `);
      similarProjectIds = res.rows.map((r) => ({
        sourceId: String((r as Record<string, unknown>).sourceId),
        distance: Number((r as Record<string, unknown>).distance),
      }));
    } catch (e) {
      console.error("Project similarity search failed:", e);
    }

    if (
      !similarProjectIds.length ||
      similarProjectIds.every((r) => r.distance === null)
    ) {
      const fallbackProjects = await db.query.project.findMany({
        where: ne(project.id, projectId),
        orderBy: [desc(project.createdAt)],
        limit,
        with: {
          translations: { where: eq(projectTranslation.language, lang) },
          technologies: { with: { skill: true } },
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

    const projectsRes = await db.query.project.findMany({
      where: inArray(project.id, ids),
      with: {
        translations: { where: eq(projectTranslation.language, lang) },
        technologies: { with: { skill: true } },
      },
    });

    return ids
      .map((id) => {
        const p = projectsRes.find((proj) => proj.id === id);
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
      const res = await db.execute<RawResult>(sql`
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
      `);
      similarBlogIds = res.rows.map((r) => ({
        sourceId: String((r as Record<string, unknown>).sourceId),
        distance: Number((r as Record<string, unknown>).distance),
      }));
    } catch (e) {
      console.error("Blog similarity search failed:", e);
    }

    if (
      !similarBlogIds.length ||
      similarBlogIds.every((r) => r.distance === null)
    ) {
      const fallbackPosts = await db.query.blogPost.findMany({
        where: and(
          ne(blogPost.id, blogPostId),
          eq(blogPost.status, "published"),
        ),
        orderBy: [desc(blogPost.createdAt)],
        limit,
        with: {
          translations: { where: eq(blogPostTranslation.language, lang) },
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

    const postsRes = await db.query.blogPost.findMany({
      where: and(inArray(blogPost.id, ids), eq(blogPost.status, "published")),
      with: {
        translations: { where: eq(blogPostTranslation.language, lang) },
      },
    });

    return ids
      .map((id) => {
        const p = postsRes.find((post) => post.id === id);
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
