import { db } from "@/lib/db";
import { blogPost, project, workExperience } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ASSISTANT_LOCALES, type AssistantLocale } from "../config";
import { contentToBlocks, contentToPlainText, truncate, type TextBlock } from "./text";

/**
 * Builds normalised "knowledge sources" from the content tables.
 *
 * A source is one entity in one language. Structured attributes become
 * `facts` (they are embedded and full-text indexed as an "overview" chunk,
 * so "Which projects use Redis?" matches even when the prose never says so);
 * long-form content becomes heading-aware `blocks`.
 */

export type KnowledgeSourceType = "project" | "blog" | "experience" | "profile";

export interface KnowledgeSource {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  language: AssistantLocale;
  title: string;
  path: string;
  summary: string;
  facts: string[];
  blocks: TextBlock[];
}

export type SyncTarget =
  | "all"
  | { sourceType: KnowledgeSourceType; sourceId?: string };

const isAssistantLocale = (value: string): value is AssistantLocale =>
  (ASSISTANT_LOCALES as readonly string[]).includes(value);

function formatMonth(date: Date | null | undefined, language: AssistantLocale) {
  if (!date) return null;
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

const LABELS = {
  tr: {
    technologies: "Teknolojiler",
    category: "Kategori",
    status: "Durum",
    featured: "Öne çıkan proje",
    github: "GitHub",
    liveDemo: "Canlı demo",
    tags: "Etiketler",
    published: "Yayın tarihi",
    readTime: "Okuma süresi",
    company: "Şirket",
    role: "Pozisyon",
    period: "Dönem",
    present: "halen",
    workType: "Çalışma şekli",
    email: "E-posta",
    linkedin: "LinkedIn",
    goals: "Hedefler",
    completed: "tamamlandı",
    inProgress: "devam ediyor",
  },
  en: {
    technologies: "Technologies",
    category: "Category",
    status: "Status",
    featured: "Featured project",
    github: "GitHub",
    liveDemo: "Live demo",
    tags: "Tags",
    published: "Published",
    readTime: "Reading time",
    company: "Company",
    role: "Role",
    period: "Period",
    present: "present",
    workType: "Work type",
    email: "Email",
    linkedin: "LinkedIn",
    goals: "Goals",
    completed: "completed",
    inProgress: "in progress",
  },
} as const;

async function loadProjects(ids?: string[]): Promise<KnowledgeSource[]> {
  const rows = await db.query.project.findMany({
    where: ids ? inArray(project.id, ids) : undefined,
    with: {
      translations: true,
      category: true,
      technologies: { with: { skill: true } },
    },
  });

  return rows.flatMap((row) =>
    row.translations
      .filter((t) => isAssistantLocale(t.language) && t.title.trim())
      .map((t) => {
        const language = t.language as AssistantLocale;
        const l = LABELS[language];
        const technologies = row.technologies
          .map((tech) => tech.skill?.name)
          .filter(Boolean);
        const facts = [
          technologies.length && `${l.technologies}: ${technologies.join(", ")}`,
          row.category?.name && `${l.category}: ${row.category.name}`,
          row.status && `${l.status}: ${row.status}`,
          row.featured && l.featured,
          row.github && `${l.github}: ${row.github}`,
          row.liveDemo && `${l.liveDemo}: ${row.liveDemo}`,
          t.keywords?.length && `${l.tags}: ${t.keywords.join(", ")}`,
        ].filter((fact): fact is string => Boolean(fact));

        return {
          sourceType: "project" as const,
          sourceId: row.id,
          language,
          title: t.title.trim(),
          path: `/projects/${row.slug}`,
          summary: t.shortDescription?.trim() ?? "",
          facts,
          blocks: contentToBlocks(t.fullDescription),
        };
      }),
  );
}

async function loadBlogPosts(ids?: string[]): Promise<KnowledgeSource[]> {
  const rows = await db.query.blogPost.findMany({
    where: ids
      ? inArray(blogPost.id, ids)
      : eq(blogPost.status, "published"),
    with: { translations: true, category: true },
  });

  return rows
    .filter((row) => row.status === "published")
    .flatMap((row) =>
      row.translations
        .filter((t) => isAssistantLocale(t.language) && t.title.trim())
        .map((t) => {
          const language = t.language as AssistantLocale;
          const l = LABELS[language];
          const published =
            formatMonth(row.publishedAt, language) ?? t.date ?? null;
          const facts = [
            row.category?.name && `${l.category}: ${row.category.name}`,
            row.tags?.length && `${l.tags}: ${row.tags.join(", ")}`,
            published && `${l.published}: ${published}`,
            t.readTime && `${l.readTime}: ${t.readTime}`,
          ].filter((fact): fact is string => Boolean(fact));

          return {
            sourceType: "blog" as const,
            sourceId: row.id,
            language,
            title: t.title.trim(),
            path: `/blog/${row.slug}`,
            summary: (t.description || t.excerpt || "").trim(),
            facts,
            blocks: contentToBlocks(t.content),
          };
        }),
    );
}

async function loadExperiences(ids?: string[]): Promise<KnowledgeSource[]> {
  const rows = await db.query.workExperience.findMany({
    where: ids ? inArray(workExperience.id, ids) : undefined,
    with: { translations: true },
  });

  return rows.flatMap((row) =>
    row.translations
      .filter((t) => isAssistantLocale(t.language) && t.role.trim())
      .map((t) => {
        const language = t.language as AssistantLocale;
        const l = LABELS[language];
        const start = formatMonth(row.startDate, language);
        const end = row.endDate ? formatMonth(row.endDate, language) : l.present;
        const facts = [
          `${l.company}: ${row.company}`,
          `${l.role}: ${t.role}`,
          start && `${l.period}: ${start} – ${end}`,
          t.locationType && `${l.workType}: ${t.locationType}`,
        ].filter((fact): fact is string => Boolean(fact));

        return {
          sourceType: "experience" as const,
          sourceId: row.id,
          language,
          title: `${t.role} · ${row.company}`,
          path: "/work",
          summary: truncate(contentToPlainText(t.description), 280),
          facts,
          blocks: contentToBlocks(t.description),
        };
      }),
  );
}

async function loadProfile(): Promise<KnowledgeSource[]> {
  const row = await db.query.profile.findFirst({
    with: { translations: true, quests: { with: { translations: true } } },
  });
  if (!row) return [];

  return row.translations
    .filter((t) => isAssistantLocale(t.language) && t.name.trim())
    .map((t) => {
      const language = t.language as AssistantLocale;
      const l = LABELS[language];
      const goals = row.quests
        .sort((a, b) => a.order - b.order)
        .map((quest) => {
          const title = quest.translations.find((q) => q.language === language)?.title;
          return title
            ? `${title} (${quest.completed ? l.completed : l.inProgress})`
            : null;
        })
        .filter(Boolean);
      const facts = [
        t.title && `${t.name} — ${t.title}`,
        row.email && `${l.email}: ${row.email}`,
        row.github && `${l.github}: ${row.github}`,
        row.linkedin && `${l.linkedin}: ${row.linkedin}`,
        goals.length && `${l.goals}: ${goals.join("; ")}`,
      ].filter((fact): fact is string => Boolean(fact));

      const blocks: TextBlock[] = [
        ...contentToBlocks(t.description),
        ...(t.aboutTitle ? [{ kind: "heading" as const, level: 2, text: t.aboutTitle }] : []),
        ...contentToBlocks(t.aboutDescription),
      ];

      return {
        sourceType: "profile" as const,
        sourceId: row.id,
        language,
        title: t.name.trim(),
        path: "/",
        summary: truncate(contentToPlainText(t.description) || t.title, 280),
        facts,
        blocks,
      };
    });
}

/**
 * Loads the sources a sync target covers. For a single-entity target the
 * result may be empty (entity deleted, blog unpublished) — the indexer then
 * removes that entity from the index.
 */
export async function loadKnowledgeSources(
  target: SyncTarget,
): Promise<KnowledgeSource[]> {
  if (target === "all") {
    const groups = await Promise.all([
      loadProfile(),
      loadExperiences(),
      loadProjects(),
      loadBlogPosts(),
    ]);
    return groups.flat();
  }

  const ids = target.sourceId ? [target.sourceId] : undefined;
  switch (target.sourceType) {
    case "project":
      return loadProjects(ids);
    case "blog":
      return loadBlogPosts(ids);
    case "experience":
      return loadExperiences(ids);
    case "profile":
      return loadProfile();
  }
}
