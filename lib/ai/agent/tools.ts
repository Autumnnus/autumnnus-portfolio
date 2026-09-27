import { tool } from "ai";
import { z } from "zod";
import { sendTelegramNotification } from "@/lib/telegram";
import { consumeRateLimits } from "../chat/rate-limit";
import { searchKnowledge, type SearchTrace } from "../knowledge/search";
import { truncate } from "../knowledge/text";
import {
  getCareer,
  getPostDetail,
  getProfileOverview,
  getProjectDetail,
  listPostCards,
  listProjectCards,
} from "./data";
import { getSiteGuide } from "./site-guide";
import { citeKeyFromPath } from "./sources";

/**
 * The agent's tool belt.
 *
 * Design rules:
 * - Structured questions go to typed, deterministic tools (SQL, computed
 *   dates); free-form questions go to hybrid search.
 * - Tools return compact JSON the widget renders as cards; `toModelOutput`
 *   gives the model a terse text view with citation keys.
 * - Only published content is reachable. The single side-effecting tool
 *   (`contactOwner`) is gated by a policy check and explicit user approval.
 */

const locale = z.enum(["tr", "en"]);
const localeContext = z.object({ locale });
const contentType = z.enum(["project", "blog", "experience", "profile"]);

// ─── searchKnowledge ─────────────────────────────────────────────────────────

export interface SearchResultItem {
  cite: string;
  type: z.infer<typeof contentType>;
  title: string;
  path: string;
  section: string | null;
  snippet: string;
  relevance: number | null;
}

export interface SearchToolOutput {
  status: "searching" | "done";
  query: string;
  results: SearchResultItem[];
  trace: Pick<
    SearchTrace,
    "lexical" | "vector" | "pooled" | "judged" | "kept" | "degraded" | "ms"
  > & { judge: string | null } | null;
}

export const searchKnowledgeTool = tool({
  description:
    "Hybrid (semantic + keyword) search over everything published on the site: project write-ups, blog posts, work experience and the about page. Use it for open-ended questions, opinions the owner wrote about, how something was built, or anything the structured tools cannot answer. Several focused searches beat one vague search.",
  inputSchema: z.object({
    query: z
      .string()
      .min(2)
      .max(200)
      .describe(
        "A self-contained search query with the key entities and technologies. Resolve pronouns from the conversation first.",
      ),
    types: z
      .array(contentType)
      .max(4)
      .optional()
      .describe("Optionally restrict the search to these content types."),
  }),
  contextSchema: z.object({ locale, question: z.string() }),
  async *execute({ query, types }, { context, abortSignal }): AsyncGenerator<SearchToolOutput> {
    yield { status: "searching", query, results: [], trace: null };

    const { hits, trace } = await searchKnowledge({
      query,
      question: context.question,
      locale: context.locale,
      types,
      abortSignal,
    });

    yield {
      status: "done",
      query,
      results: hits.map((hit) => ({
        cite: citeKeyFromPath(hit.sourceType, hit.path, hit.sourceId),
        type: hit.sourceType,
        title: hit.title,
        path: hit.path,
        section: hit.heading,
        snippet: truncate(hit.content, 900),
        relevance: hit.relevance === null ? null : Math.round(hit.relevance * 100) / 100,
      })),
      trace: {
        lexical: trace.lexical,
        vector: trace.vector,
        pooled: trace.pooled,
        judged: trace.judged,
        kept: trace.kept,
        degraded: trace.degraded,
        ms: trace.ms,
        judge: trace.judge?.provider ?? null,
      },
    };
  },
  toModelOutput: ({ output }) => {
    if (!output.results.length) {
      return {
        type: "text",
        value: `No published content matched "${output.query}". Say so honestly; do not guess.`,
      };
    }
    return {
      type: "text",
      value: output.results
        .map(
          (r) =>
            `[${r.cite}] ${r.title}${r.section ? ` — ${r.section}` : ""} (${r.path})\n${r.snippet}`,
        )
        .join("\n\n---\n\n"),
    };
  },
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const listProjectsTool = tool({
  description:
    "List the owner's projects, optionally filtered by technology (e.g. 'React', 'PostgreSQL'), category or featured flag. Returns the total count too, so use it for 'how many' questions.",
  inputSchema: z.object({
    technology: z.string().max(40).optional(),
    category: z.string().max(40).optional(),
    featured: z.boolean().optional().describe("Only featured / highlighted projects."),
    limit: z.number().int().min(1).max(12).default(6),
  }),
  contextSchema: localeContext,
  execute: async ({ technology, category, featured, limit }, { context }) =>
    listProjectCards({ locale: context.locale, technology, category, featured, limit }),
  toModelOutput: ({ output }) => ({
    type: "json",
    value: {
      total: output.total,
      projects: output.projects.map((p) => ({
        cite: p.cite,
        title: p.title,
        summary: p.summary,
        technologies: p.technologies,
        category: p.category,
        status: p.status,
        featured: p.featured,
        year: p.year,
        path: p.path,
        github: p.github,
        liveDemo: p.liveDemo,
      })),
    },
  }),
});

export const getProjectTool = tool({
  description:
    "Full details of one project by slug: description, tech stack, links, status, dates. Use after listProjects/search, or when the visitor is on a project page.",
  inputSchema: z.object({ slug: z.string().min(1).max(120) }),
  contextSchema: localeContext,
  execute: async ({ slug }, { context }) => {
    const project = await getProjectDetail(slug, context.locale);
    return project ? { found: true as const, project } : { found: false as const, slug };
  },
  toModelOutput: ({ output }) => {
    if (!output.found) return { type: "text", value: `No project with slug "${output.slug}".` };
    const { coverImage: _cover, ...project } = output.project;
    void _cover;
    return { type: "json", value: project };
  },
});

// ─── Blog ────────────────────────────────────────────────────────────────────

export const listPostsTool = tool({
  description:
    "List published blog posts (newest first), optionally filtered by tag or category. Returns the total count too.",
  inputSchema: z.object({
    tag: z.string().max(40).optional(),
    category: z.string().max(40).optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  contextSchema: localeContext,
  execute: async ({ tag, category, limit }, { context }) =>
    listPostCards({ locale: context.locale, tag, category, limit }),
  toModelOutput: ({ output }) => ({
    type: "json",
    value: {
      total: output.total,
      posts: output.posts.map((p) => ({
        cite: p.cite,
        title: p.title,
        description: p.description,
        tags: p.tags,
        publishedAt: p.publishedAt,
        readTime: p.readTime,
        path: p.path,
      })),
    },
  }),
});

export const getPostTool = tool({
  description:
    "Read one published blog post by slug (full text). Use to summarise or answer questions about a specific post, e.g. the one the visitor is currently reading.",
  inputSchema: z.object({ slug: z.string().min(1).max(160) }),
  contextSchema: localeContext,
  execute: async ({ slug }, { context }) => {
    const post = await getPostDetail(slug, context.locale);
    return post ? { found: true as const, post } : { found: false as const, slug };
  },
  toModelOutput: ({ output }) => {
    if (!output.found) return { type: "text", value: `No published post with slug "${output.slug}".` };
    const { coverImage: _cover, ...post } = output.post;
    void _cover;
    return { type: "json", value: post };
  },
});

// ─── Career & profile ────────────────────────────────────────────────────────

export const getCareerTool = tool({
  description:
    "Work history: companies, roles, dates, durations (pre-computed) and total years of experience. Use for any question about experience, jobs or seniority — never compute dates yourself.",
  inputSchema: z.object({}),
  contextSchema: localeContext,
  execute: async (_input, { context }) => getCareer(context.locale),
});

export const getProfileTool = tool({
  description:
    "The owner's profile: name, title, bio, contact links, goals, and their tech stack ranked by how many projects use each technology.",
  inputSchema: z.object({}),
  contextSchema: localeContext,
  execute: async (_input, { context }) => {
    const profile = await getProfileOverview(context.locale);
    return profile ? { found: true as const, profile } : { found: false as const };
  },
  toModelOutput: ({ output }) => {
    if (!output.found) return { type: "text", value: "No profile has been published yet." };
    const { avatar: _avatar, ...profile } = output.profile;
    void _avatar;
    return { type: "json", value: profile };
  },
});

// ─── Homepage game ───────────────────────────────────────────────────────────

export const getSiteGuideTool = tool({
  description:
    "Everything about the hidden mini-game in the homepage pixel scene: the 5 secrets to find (where and how), the 5 secret codes (riddles, answers, accepted spellings, effects), the Konami code, the code console, hints, achievements and seasons. Use for any question about the site's game, secrets, easter eggs, cheat codes or puzzles.",
  inputSchema: z.object({}),
  contextSchema: localeContext,
  execute: async (_input, { context }) => getSiteGuide(context.locale),
});

// ─── contactOwner (side effect → approval required) ─────────────────────────

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const contactOwnerTool = tool({
  description:
    "Send the visitor's message to the owner (delivered instantly to the owner's phone). Only call it when the visitor explicitly wants to contact, hire or reach the owner AND has given both a message and a way to reply. Never invent contact details. The visitor sees a confirmation card and must approve before anything is sent.",
  inputSchema: z.object({
    name: z.string().max(80).optional(),
    replyTo: z
      .string()
      .min(3)
      .max(120)
      .describe("Email address or other handle the owner can reply to, exactly as the visitor gave it."),
    topic: z.enum(["job", "freelance", "collaboration", "question", "feedback", "other"]),
    message: z
      .string()
      .min(10)
      .max(1200)
      .describe("The visitor's message in their own words. Do not embellish or add content."),
  }),
  contextSchema: z.object({
    visitorKey: z.string(),
    threadId: z.string(),
    pagePath: z.string().nullable(),
  }),
  execute: async (input, { context }) => {
    const quota = await consumeRateLimits([
      { key: `contact:${context.visitorKey}`, limit: 3 },
    ]);
    if (!quota.ok) return { delivered: false, reason: "limit" as const };

    if (process.env.NODE_ENV === "development") {
      console.info("[assistant] contactOwner (dev, not sent):", input);
      return { delivered: true, simulated: true };
    }

    const text = [
      "💬 <b>New message via the AI assistant</b>",
      `<b>Topic:</b> ${escapeHtml(input.topic)}`,
      input.name ? `<b>Name:</b> ${escapeHtml(input.name)}` : null,
      `<b>Reply to:</b> ${escapeHtml(input.replyTo)}`,
      context.pagePath ? `<b>Page:</b> ${escapeHtml(context.pagePath)}` : null,
      "",
      escapeHtml(input.message),
      "",
      `<i>thread ${escapeHtml(context.threadId.slice(0, 12))}</i>`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const delivered = await sendTelegramNotification(text);
    return delivered
      ? { delivered: true }
      : { delivered: false, reason: "unavailable" as const };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: output.delivered
      ? "Message delivered to the owner. Confirm briefly; they will reply via the contact the visitor gave."
      : output.reason === "limit"
        ? "Not sent: this visitor reached today's message limit. Suggest the email / LinkedIn links from the profile instead."
        : "Not sent: delivery is unavailable right now. Suggest the email / LinkedIn links from the profile instead.",
  }),
});

export const assistantTools = {
  searchKnowledge: searchKnowledgeTool,
  listProjects: listProjectsTool,
  getProject: getProjectTool,
  listPosts: listPostsTool,
  getPost: getPostTool,
  getCareer: getCareerTool,
  getProfile: getProfileTool,
  getSiteGuide: getSiteGuideTool,
  contactOwner: contactOwnerTool,
};

export type AssistantTools = typeof assistantTools;
export type AssistantToolName = keyof AssistantTools;
