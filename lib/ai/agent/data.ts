import { db } from "@/lib/db";
import { blogPost, project } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { AssistantLocale } from "../config";
import { contentToPlainText, truncate } from "../knowledge/text";
import { citeKey } from "./sources";

/**
 * Read models for the agent's structured tools.
 *
 * Deliberately separate from the page queries: the agent gets compact,
 * published-only data in the visitor's language (falling back to the other
 * language), and every date / duration is computed here — language models
 * and System One models are both unreliable at date arithmetic.
 */

type Translated = { language: string };

function pick<T extends Translated>(translations: T[], locale: AssistantLocale): T | undefined {
  return (
    translations.find((t) => t.language === locale) ??
    translations.find((t) => t.language === (locale === "tr" ? "en" : "tr")) ??
    translations[0]
  );
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#.]/g, "");

function matches(haystack: (string | null | undefined)[], needle?: string) {
  if (!needle) return true;
  const n = normalize(needle);
  return haystack.some((value) => value && normalize(value).includes(n));
}

function yearOf(date: Date | null | undefined) {
  return date ? date.getUTCFullYear() : null;
}

function monthsBetween(start: Date, end: Date) {
  return Math.max(
    1,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth()) +
      1,
  );
}

const isoMonth = (date: Date | null | undefined) =>
  date ? date.toISOString().slice(0, 7) : null;

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ProjectCard {
  cite: string;
  slug: string;
  title: string;
  summary: string;
  technologies: string[];
  category: string | null;
  status: string;
  featured: boolean;
  coverImage: string | null;
  github: string | null;
  liveDemo: string | null;
  path: string;
  year: number | null;
}

async function loadProjects() {
  return db.query.project.findMany({
    with: {
      translations: true,
      category: true,
      technologies: { with: { skill: true } },
    },
    orderBy: (p, { desc }) => [desc(p.featured), desc(p.createdAt)],
  });
}

type ProjectRow = Awaited<ReturnType<typeof loadProjects>>[number];

function toProjectCard(row: ProjectRow, locale: AssistantLocale): ProjectCard | null {
  const t = pick(row.translations, locale);
  if (!t) return null;
  return {
    cite: citeKey("project", { slug: row.slug }),
    slug: row.slug,
    title: t.title,
    summary: truncate(t.shortDescription ?? "", 220),
    technologies: row.technologies.map((tech) => tech.skill?.name).filter(Boolean) as string[],
    category: row.category?.name ?? null,
    status: row.status,
    featured: row.featured,
    coverImage: row.coverImage,
    github: row.github,
    liveDemo: row.liveDemo,
    path: `/projects/${row.slug}`,
    year: yearOf(row.createdAt),
  };
}

export async function listProjectCards({
  locale,
  technology,
  category,
  featured,
  limit,
}: {
  locale: AssistantLocale;
  technology?: string;
  category?: string;
  featured?: boolean;
  limit: number;
}) {
  const rows = await loadProjects();
  const cards = rows
    .map((row) => ({ row, card: toProjectCard(row, locale) }))
    .filter(({ row, card }) => {
      if (!card) return false;
      if (featured && !row.featured) return false;
      if (category && !matches([row.category?.name], category)) return false;
      if (
        technology &&
        !matches(
          row.technologies.flatMap((tech) => [tech.skill?.name, tech.skill?.key]),
          technology,
        )
      ) {
        return false;
      }
      return true;
    })
    .map(({ card }) => card!);

  return { total: cards.length, projects: cards.slice(0, limit) };
}

export async function getProjectDetail(slug: string, locale: AssistantLocale) {
  const row = await db.query.project.findFirst({
    where: eq(project.slug, slug),
    with: {
      translations: true,
      category: true,
      technologies: { with: { skill: true } },
    },
  });
  if (!row) return null;
  const card = toProjectCard(row, locale);
  const t = pick(row.translations, locale);
  if (!card || !t) return null;
  return {
    ...card,
    description: truncate(contentToPlainText(t.fullDescription), 6_000),
    createdAt: isoMonth(row.createdAt),
    updatedAt: isoMonth(row.updatedAt),
  };
}

// ─── Blog ────────────────────────────────────────────────────────────────────

export interface PostCard {
  cite: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string | null;
  publishedAt: string | null;
  readTime: string | null;
  coverImage: string | null;
  featured: boolean;
  path: string;
}

async function loadPublishedPosts() {
  return db.query.blogPost.findMany({
    where: eq(blogPost.status, "published"),
    with: { translations: true, category: true },
    orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
  });
}

type PostRow = Awaited<ReturnType<typeof loadPublishedPosts>>[number];

function toPostCard(row: PostRow, locale: AssistantLocale): PostCard | null {
  const t = pick(row.translations, locale);
  if (!t) return null;
  return {
    cite: citeKey("blog", { slug: row.slug }),
    slug: row.slug,
    title: t.title,
    description: truncate(t.description || t.excerpt || "", 220),
    tags: row.tags ?? [],
    category: row.category?.name ?? null,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
    readTime: t.readTime || null,
    coverImage: row.coverImage,
    featured: row.featured,
    path: `/blog/${row.slug}`,
  };
}

export async function listPostCards({
  locale,
  tag,
  category,
  limit,
}: {
  locale: AssistantLocale;
  tag?: string;
  category?: string;
  limit: number;
}) {
  const rows = await loadPublishedPosts();
  const cards = rows
    .filter((row) => matches(row.tags ?? [], tag) && matches([row.category?.name], category))
    .map((row) => toPostCard(row, locale))
    .filter((card): card is PostCard => Boolean(card));
  return { total: cards.length, posts: cards.slice(0, limit) };
}

export async function getPostDetail(slug: string, locale: AssistantLocale) {
  const row = await db.query.blogPost.findFirst({
    where: and(eq(blogPost.slug, slug), eq(blogPost.status, "published")),
    with: { translations: true, category: true },
  });
  if (!row) return null;
  const card = toPostCard(row, locale);
  const t = pick(row.translations, locale);
  if (!card || !t) return null;
  return { ...card, content: truncate(contentToPlainText(t.content), 8_000) };
}

// ─── Career & profile ────────────────────────────────────────────────────────

export async function getCareer(locale: AssistantLocale) {
  const rows = await db.query.workExperience.findMany({
    with: { translations: true },
    orderBy: (w, { desc }) => [desc(w.startDate)],
  });
  const now = new Date();

  const positions = rows
    .map((row) => {
      const t = pick(row.translations, locale);
      if (!t) return null;
      const start = row.startDate;
      const end = row.endDate ?? now;
      return {
        cite: citeKey("experience", { id: row.id }),
        company: row.company,
        role: t.role,
        workType: t.locationType || null,
        start: isoMonth(start),
        end: row.endDate ? isoMonth(row.endDate) : null,
        current: !row.endDate,
        durationMonths: start ? monthsBetween(start, end) : null,
        description: truncate(contentToPlainText(t.description), 900),
      };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Total experience = union of date ranges (overlapping jobs count once).
  const ranges = rows
    .filter((row) => row.startDate)
    .map((row) => [row.startDate!.getTime(), (row.endDate ?? now).getTime()] as const)
    .sort((a, b) => a[0] - b[0]);
  let totalMs = 0;
  let cursor = -Infinity;
  for (const [start, end] of ranges) {
    const from = Math.max(start, cursor);
    if (end > from) totalMs += end - from;
    cursor = Math.max(cursor, end);
  }
  const totalYears = Math.round((totalMs / (365.25 * 24 * 3600 * 1000)) * 10) / 10;

  return {
    today: now.toISOString().slice(0, 10),
    totalExperienceYears: totalYears,
    positions,
    path: "/work",
  };
}

export async function getProfileOverview(locale: AssistantLocale) {
  const [row, socials, projects] = await Promise.all([
    db.query.profile.findFirst({
      with: { translations: true, quests: { with: { translations: true } } },
    }),
    db.query.socialLink.findMany(),
    db.query.project.findMany({ with: { technologies: { with: { skill: true } } } }),
  ]);
  if (!row) return null;
  const t = pick(row.translations, locale);
  if (!t) return null;

  const stack = new Map<string, number>();
  for (const p of projects) {
    for (const tech of p.technologies) {
      if (tech.skill?.name) stack.set(tech.skill.name, (stack.get(tech.skill.name) ?? 0) + 1);
    }
  }

  return {
    cite: "about",
    name: t.name,
    title: t.title,
    intro: truncate(contentToPlainText(t.description), 800),
    about: truncate(contentToPlainText(t.aboutDescription), 2_500),
    avatar: row.avatar,
    links: {
      email: row.email,
      github: row.github,
      linkedin: row.linkedin,
      other: socials.map((s) => ({ name: s.name, url: s.href })),
    },
    goals: row.quests
      .sort((a, b) => a.order - b.order)
      .map((quest) => ({
        title: pick(quest.translations, locale)?.title ?? "",
        completed: quest.completed,
      }))
      .filter((goal) => goal.title),
    stack: [...stack.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, projectCount]) => ({ name, projectCount })),
    path: "/",
  };
}

/** Owner name/title for the system prompt (cached per process & locale). */
const ownerCache = new Map<AssistantLocale, { name: string; title: string; at: number }>();
export async function getOwnerIdentity(locale: AssistantLocale) {
  const cached = ownerCache.get(locale);
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached;
  const row = await db.query.profile.findFirst({ with: { translations: true } });
  const t = row ? pick(row.translations, locale) : undefined;
  const identity = {
    name: t?.name || (locale === "tr" ? "site sahibi" : "the site owner"),
    title: t?.title || "software developer",
    at: Date.now(),
  };
  ownerCache.set(locale, identity);
  return identity;
}
