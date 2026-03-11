import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiChatMessage, aiChatSession, chatRateLimit } from "@/lib/db/schema";
import { generateEmbedding } from "@/lib/embeddings";
import { getGeminiFlashLiteModel } from "@/lib/gemini";
import { type EmbeddingResult, searchSimilar } from "@/lib/vectordb";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_DAILY = 20;
const HISTORY_LIMIT = 12;
const SEARCH_RESULT_LIMIT = 10;
const SEARCH_DISTANCE_THRESHOLD = 0.58;
const PORTFOLIO_UPGRADE_THRESHOLD = 0.67;
const SOURCE_DISPLAY_THRESHOLD = 0.58;

export interface HistorySourceItem {
  sourceType: "project" | "blog" | "profile" | "experience";
  title: string;
  url: string;
}

export interface HistoryMessage {
  role: "user" | "ai";
  content: string;
  sources?: HistorySourceItem[];
}

export interface SourceItem {
  sourceType: "project" | "blog" | "profile" | "experience";
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  github?: string;
  liveDemo?: string;
  category?: string;
  tags?: string[];
  technologies?: string[];
  similarity: number;
}

interface FetchResult {
  contextBlocks: string[];
  sources: SourceItem[];
}

interface IntentResult {
  intent: "greeting" | "inappropriate" | "general_chat" | "portfolio_query";
  refinedQuery: string;
  standaloneQuestion: string;
  useHistory: boolean;
}

interface GroupedChunkContext {
  sourceType: SourceItem["sourceType"];
  sourceId: string;
  maxSimilarity: number;
  snippets: string[];
}

function getSourceKey(sourceType: string, sourceId: string): string {
  return `${sourceType}:${sourceId}`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clipText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function sanitizeChunkSnippet(chunkText: string): string {
  return clipText(normalizeWhitespace(chunkText), 420);
}

function dedupeValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("en");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function dedupeSources(sources: SourceItem[]): SourceItem[] {
  const byKey = new Map<string, SourceItem>();

  for (const source of sources) {
    const key = `${source.sourceType}:${source.url}`;
    const existing = byKey.get(key);
    if (!existing || source.similarity > existing.similarity) {
      byKey.set(key, source);
    }
  }

  return Array.from(byKey.values());
}

function formatHistoryText(history: HistoryMessage[]): string {
  return history
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "AutumnAI";
      const sourceLine =
        message.sources && message.sources.length > 0
          ? `\nReferenced sources: ${message.sources
              .map(
                (source) =>
                  `${source.title} [${source.sourceType}] (${source.url})`,
              )
              .join("; ")}`
          : "";

      return `${speaker}: ${message.content}${sourceLine}`;
    })
    .join("\n\n");
}

function extractRecentSourceHints(history: HistoryMessage[]): HistorySourceItem[] {
  const result: HistorySourceItem[] = [];
  const seen = new Set<string>();

  for (const message of [...history].reverse()) {
    for (const source of message.sources ?? []) {
      const key = `${source.sourceType}:${source.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(source);

      if (result.length >= 4) {
        return result;
      }
    }
  }

  return result;
}

function formatSourceHints(sourceHints: HistorySourceItem[]): string {
  if (sourceHints.length === 0) return "None";

  return sourceHints
    .map(
      (source) => `- ${source.title} [${source.sourceType}] (${source.url})`,
    )
    .join("\n");
}

function parseStoredSources(metadata: unknown): HistorySourceItem[] {
  if (!metadata || typeof metadata !== "object") return [];

  const sources = (metadata as { sources?: unknown }).sources;
  if (!Array.isArray(sources)) return [];

  return sources.flatMap((source) => {
    if (!source || typeof source !== "object") return [];

    const sourceType = (source as { sourceType?: unknown }).sourceType;
    const title = (source as { title?: unknown }).title;
    const url = (source as { url?: unknown }).url;

    if (
      (sourceType === "project" ||
        sourceType === "blog" ||
        sourceType === "profile" ||
        sourceType === "experience") &&
      typeof title === "string" &&
      typeof url === "string"
    ) {
      return [{ sourceType, title, url }];
    }

    return [];
  });
}

function mergeHistoryMessages(
  persistedHistory: HistoryMessage[],
  clientHistory: HistoryMessage[],
): HistoryMessage[] {
  const merged = [...persistedHistory, ...clientHistory].flatMap((message) => {
    const content = typeof message.content === "string" ? message.content.trim() : "";
    if (!content) return [];
    if (message.role !== "user" && message.role !== "ai") return [];

    return [
      {
        role: message.role,
        content,
        sources:
          message.sources?.filter(
            (source) =>
              typeof source.title === "string" && typeof source.url === "string",
          ) ?? [],
      },
    ];
  });

  const compacted: HistoryMessage[] = [];

  for (const message of merged) {
    const previous = compacted[compacted.length - 1];
    const previousSources = JSON.stringify(previous?.sources ?? []);
    const nextSources = JSON.stringify(message.sources ?? []);

    if (
      previous &&
      previous.role === message.role &&
      previous.content === message.content &&
      previousSources === nextSources
    ) {
      continue;
    }

    compacted.push(message);
  }

  return compacted.slice(-HISTORY_LIMIT);
}

async function getPersistedHistory(sessionId: string): Promise<HistoryMessage[]> {
  const storedMessages = await db.query.aiChatMessage.findMany({
    where: (message, { eq }) => eq(message.sessionId, sessionId),
    orderBy: (message, { desc }) => [desc(message.createdAt)],
    limit: HISTORY_LIMIT * 2,
    columns: {
      role: true,
      content: true,
      metadata: true,
    },
  });

  return storedMessages.reverse().map((message) => ({
    role: message.role === "user" ? "user" : "ai",
    content: message.content,
    sources: parseStoredSources(message.metadata),
  }));
}

async function searchPortfolioChunks(
  queries: string[],
  locale: string,
): Promise<EmbeddingResult[]> {
  const uniqueQueries = dedupeValues(queries).slice(0, 4);

  if (uniqueQueries.length === 0) {
    return [];
  }

  const searchResults = await Promise.all(
    uniqueQueries.map(async (query) => {
      const embedding = await generateEmbedding(query);
      return searchSimilar(
        embedding,
        locale,
        6,
        SEARCH_DISTANCE_THRESHOLD,
      );
    }),
  );

  const merged = new Map<
    string,
    EmbeddingResult & { retrievalScore: number; matchCount: number }
  >();

  for (const resultSet of searchResults) {
    for (const chunk of resultSet) {
      const existing = merged.get(chunk.id);
      if (!existing) {
        merged.set(chunk.id, {
          ...chunk,
          retrievalScore: chunk.similarity,
          matchCount: 1,
        });
        continue;
      }

      const nextMatchCount = existing.matchCount + 1;
      const nextSimilarity = Math.max(existing.similarity, chunk.similarity);

      merged.set(chunk.id, {
        ...chunk,
        similarity: nextSimilarity,
        matchCount: nextMatchCount,
        retrievalScore: nextSimilarity + (nextMatchCount - 1) * 0.03,
      });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => {
      if (b.retrievalScore !== a.retrievalScore) {
        return b.retrievalScore - a.retrievalScore;
      }
      return b.similarity - a.similarity;
    })
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((chunk) => ({
      id: chunk.id,
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      language: chunk.language,
      chunkText: chunk.chunkText,
      similarity: chunk.similarity,
    }));
}

function buildGroupedChunkContext(
  chunks: EmbeddingResult[],
): Map<string, GroupedChunkContext> {
  const grouped = new Map<string, GroupedChunkContext>();

  for (const chunk of chunks) {
    const key = getSourceKey(chunk.sourceType, chunk.sourceId);
    const existing = grouped.get(key);
    const snippet = sanitizeChunkSnippet(chunk.chunkText);

    if (!existing) {
      grouped.set(key, {
        sourceType: chunk.sourceType as SourceItem["sourceType"],
        sourceId: chunk.sourceId,
        maxSimilarity: chunk.similarity,
        snippets: snippet ? [snippet] : [],
      });
      continue;
    }

    existing.maxSimilarity = Math.max(existing.maxSimilarity, chunk.similarity);
    if (snippet && !existing.snippets.includes(snippet) && existing.snippets.length < 2) {
      existing.snippets.push(snippet);
    }
  }

  return grouped;
}

function buildSnippetSection(group?: GroupedChunkContext): string | null {
  if (!group || group.snippets.length === 0) {
    return null;
  }

  return [
    "RELEVANT EXCERPTS:",
    ...group.snippets.map((snippet) => `- ${snippet}`),
  ].join("\n");
}

function getSourceSimilarity(
  groups: Map<string, GroupedChunkContext>,
  sourceType: SourceItem["sourceType"],
  sourceId: string,
): number {
  return groups.get(getSourceKey(sourceType, sourceId))?.maxSimilarity ?? 0;
}

function responseMentionsSource(response: string, source: SourceItem): boolean {
  const normalizedResponse = response.toLocaleLowerCase("en");
  const normalizedTitle = source.title.toLocaleLowerCase("en");
  const normalizedUrl = source.url.toLocaleLowerCase("en");

  return (
    normalizedResponse.includes(normalizedTitle) ||
    normalizedResponse.includes(`](${normalizedUrl})`) ||
    normalizedResponse.includes(normalizedUrl)
  );
}

async function fetchMetadataForChunks(
  chunks: EmbeddingResult[],
  locale: string,
): Promise<FetchResult> {
  const lang = locale === "tr" ? "tr" : "en";
  const groupedChunks = buildGroupedChunkContext(chunks);

  const projectIds = [
    ...new Set(
      chunks.filter((chunk) => chunk.sourceType === "project").map((chunk) => chunk.sourceId),
    ),
  ];
  const blogIds = [
    ...new Set(
      chunks.filter((chunk) => chunk.sourceType === "blog").map((chunk) => chunk.sourceId),
    ),
  ];
  const profileIds = [
    ...new Set(
      chunks.filter((chunk) => chunk.sourceType === "profile").map((chunk) => chunk.sourceId),
    ),
  ];
  const experienceIds = [
    ...new Set(
      chunks
        .filter((chunk) => chunk.sourceType === "experience")
        .map((chunk) => chunk.sourceId),
    ),
  ];

  const [projects, blogs, profiles, experiences] = await Promise.all([
    projectIds.length > 0
      ? db.query.project.findMany({
          where: (project, { inArray }) => inArray(project.id, projectIds),
          columns: {
            id: true,
            slug: true,
            github: true,
            liveDemo: true,
            status: true,
            coverImage: true,
          },
          with: {
            category: { columns: { name: true } },
            technologies: {
              columns: {},
              with: { skill: { columns: { name: true } } },
            },
            translations: {
              where: (translation, { eq }) => eq(translation.language, lang),
              columns: { title: true, shortDescription: true },
            },
          },
        })
      : [],
    blogIds.length > 0
      ? db.query.blogPost.findMany({
          where: (blog, { inArray }) => inArray(blog.id, blogIds),
          columns: {
            id: true,
            slug: true,
            tags: true,
            coverImage: true,
          },
          with: {
            category: { columns: { name: true } },
            translations: {
              where: (translation, { eq }) => eq(translation.language, lang),
              columns: { title: true, description: true },
            },
          },
        })
      : [],
    profileIds.length > 0
      ? db.query.profile.findMany({
          where: (profile, { inArray }) => inArray(profile.id, profileIds),
          columns: {
            id: true,
            email: true,
            github: true,
            linkedin: true,
          },
          with: {
            translations: {
              where: (translation, { eq }) => eq(translation.language, lang),
              columns: { name: true, title: true },
            },
          },
        })
      : [],
    experienceIds.length > 0
      ? db.query.workExperience.findMany({
          where: (experience, { inArray }) => inArray(experience.id, experienceIds),
          columns: {
            id: true,
            company: true,
            startDate: true,
            endDate: true,
          },
          with: {
            translations: {
              where: (translation, { eq }) => eq(translation.language, lang),
              columns: { role: true, description: true, locationType: true },
            },
          },
        })
      : [],
  ]);

  const sortBySimilarity = <T extends { id: string }>(
    items: T[],
    sourceType: SourceItem["sourceType"],
  ) =>
    [...items].sort(
      (left, right) =>
        getSourceSimilarity(groupedChunks, sourceType, right.id) -
        getSourceSimilarity(groupedChunks, sourceType, left.id),
    );

  const contextBlocks: string[] = [];
  const sources: SourceItem[] = [];

  for (const project of sortBySimilarity(projects, "project")) {
    const translation = project.translations[0];
    const techs = (
      project.technologies as { skill: { name: string | null } | null }[]
    )
      .map((technology) => technology.skill?.name)
      .filter((name): name is string => Boolean(name));
    const portfolioUrl = `/${lang}/projects/${project.slug}`;
    const snippetSection = buildSnippetSection(
      groupedChunks.get(getSourceKey("project", project.id)),
    );

    contextBlocks.push(
      [
        "--- SOURCE: project ---",
        `TITLE: ${translation?.title ?? project.slug}`,
        `DESCRIPTION: ${translation?.shortDescription ?? ""}`,
        `PORTFOLIO URL: ${portfolioUrl}`,
        project.github ? `GITHUB: ${project.github}` : null,
        project.liveDemo ? `LIVE DEMO: ${project.liveDemo}` : null,
        project.category ? `CATEGORY: ${project.category.name}` : null,
        `STATUS: ${project.status}`,
        techs.length > 0 ? `TECHNOLOGIES: ${techs.join(", ")}` : null,
        snippetSection,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    sources.push({
      sourceType: "project",
      title: translation?.title ?? project.slug,
      description: translation?.shortDescription ?? "",
      url: portfolioUrl,
      imageUrl: project.coverImage ?? undefined,
      github: project.github ?? undefined,
      liveDemo: project.liveDemo ?? undefined,
      category: project.category?.name ?? "",
      technologies: techs,
      similarity: getSourceSimilarity(groupedChunks, "project", project.id),
    });
  }

  for (const blog of sortBySimilarity(blogs, "blog")) {
    const translation = blog.translations[0];
    const portfolioUrl = `/${lang}/blog/${blog.slug}`;
    const snippetSection = buildSnippetSection(
      groupedChunks.get(getSourceKey("blog", blog.id)),
    );

    contextBlocks.push(
      [
        "--- SOURCE: blog ---",
        `TITLE: ${translation?.title ?? blog.slug}`,
        `DESCRIPTION: ${translation?.description ?? ""}`,
        `PORTFOLIO URL: ${portfolioUrl}`,
        blog.category ? `CATEGORY: ${blog.category.name}` : null,
        blog.tags?.length ? `TAGS: ${blog.tags.join(", ")}` : null,
        snippetSection,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    sources.push({
      sourceType: "blog",
      title: translation?.title ?? blog.slug,
      description: translation?.description ?? "",
      url: portfolioUrl,
      imageUrl: blog.coverImage ?? undefined,
      category: blog.category?.name ?? "",
      tags: blog.tags ?? [],
      similarity: getSourceSimilarity(groupedChunks, "blog", blog.id),
    });
  }

  for (const profile of sortBySimilarity(profiles, "profile")) {
    const translation = profile.translations[0];
    const snippetSection = buildSnippetSection(
      groupedChunks.get(getSourceKey("profile", profile.id)),
    );

    contextBlocks.push(
      [
        "--- SOURCE: profile ---",
        `NAME: ${translation?.name ?? ""}`,
        `TITLE: ${translation?.title ?? ""}`,
        profile.email ? `EMAIL: ${profile.email}` : null,
        profile.github ? `GITHUB: ${profile.github}` : null,
        profile.linkedin ? `LINKEDIN: ${profile.linkedin}` : null,
        snippetSection,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  for (const experience of sortBySimilarity(experiences, "experience")) {
    const translation = experience.translations[0];
    const startYear = experience.startDate
      ? experience.startDate.getFullYear()
      : "";
    const endYear = experience.endDate
      ? experience.endDate.getFullYear()
      : "Present";
    const snippetSection = buildSnippetSection(
      groupedChunks.get(getSourceKey("experience", experience.id)),
    );

    contextBlocks.push(
      [
        "--- SOURCE: experience ---",
        `COMPANY: ${experience.company}`,
        `ROLE: ${translation?.role ?? ""}`,
        `LOCATION TYPE: ${translation?.locationType ?? ""}`,
        startYear ? `PERIOD: ${startYear} - ${endYear}` : null,
        `DESCRIPTION: ${translation?.description ?? ""}`,
        snippetSection,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return {
    contextBlocks,
    sources: dedupeSources(sources).sort((left, right) => right.similarity - left.similarity),
  };
}

async function getClientIp(req: NextRequest): Promise<string> {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || "0.0.0.0";
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitRecord = await db.query.chatRateLimit.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.ipAddress, ip), eq(table.date, today)),
  });

  if (limitRecord && limitRecord.requestCount >= RATE_LIMIT_DAILY) {
    return false;
  }

  await db
    .insert(chatRateLimit)
    .values({
      ipAddress: ip,
      date: today,
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: [chatRateLimit.ipAddress, chatRateLimit.date],
      set: { requestCount: sql`${chatRateLimit.requestCount} + 1` },
    });

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const ip = await getClientIp(req);

    if (!isAdmin) {
      const isAllowed = await checkRateLimit(ip);
      if (!isAllowed) {
        return NextResponse.json(
          { error: "Daily message limit reached. Please try again tomorrow." },
          { status: 429 },
        );
      }
    }

    const body = await req.json();
    const {
      message,
      locale = "en",
      history = [],
    } = body as {
      message: string;
      locale: string;
      history: HistoryMessage[];
    };

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const recentSession = await db.query.aiChatSession.findFirst({
      where: (chatSession, { eq }) => eq(chatSession.ipAddress, ip),
      orderBy: (chatSession, { desc }) => [desc(chatSession.updatedAt)],
    });

    let sessionId = recentSession?.id;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (
      !recentSession ||
      Date.now() - recentSession.updatedAt.getTime() > twoHoursMs
    ) {
      const [newSession] = await db
        .insert(aiChatSession)
        .values({ ipAddress: ip })
        .returning({ id: aiChatSession.id });
      sessionId = newSession.id;
    } else if (sessionId) {
      await db
        .update(aiChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(aiChatSession.id, sessionId));
    }

    const persistedHistory = sessionId
      ? await getPersistedHistory(sessionId)
      : [];
    const mergedHistory = mergeHistoryMessages(persistedHistory, history);
    const historyText = formatHistoryText(mergedHistory);
    const recentSourceHints = extractRecentSourceHints(mergedHistory);
    const recentSourceHintsText = formatSourceHints(recentSourceHints);

    await db.insert(aiChatMessage).values({
      sessionId: sessionId!,
      role: "user",
      content: trimmedMessage,
    });

    const model = getGeminiFlashLiteModel();
    const answerLanguage = locale === "tr" ? "Turkish (Turkce)" : "English";

    const intentPrompt = `Analyze the user's latest message for a portfolio assistant.

Latest user message:
"${trimmedMessage}"

Conversation history:
${historyText || "None"}

Recent source hints:
${recentSourceHintsText}

Rules:
- Use conversation history ONLY if the latest message depends on earlier context. Examples: pronouns like "that project", "that blog post", "its source", "the previous one", "continue", "compare it".
- If the latest message clearly changes topic or introduces a new technology/project/company, set "useHistory" to false.
- "greeting": hello, thanks, goodbye, small pleasantries.
- "inappropriate": abusive, insulting, explicit harassment.
- "general_chat": clearly unrelated to Kadir's portfolio. Examples: weather, sports, politics, cooking, romantic advice.
- "portfolio_query": anything about Kadir's projects, blog posts, experience, profile, contact details, skills, technologies used in portfolio items, or ambiguous/follow-up portfolio questions.
- Write "refinedQuery" and "standaloneQuestion" in ${answerLanguage}. Preserve original technology names, company names, URLs, and project names exactly.
- "standaloneQuestion" should fully resolve follow-up references when possible.
- If no rewrite is needed, you may keep refinedQuery and standaloneQuestion close to the user's latest message.

Return JSON only in this format:
{
  "intent": "greeting" | "inappropriate" | "general_chat" | "portfolio_query",
  "refinedQuery": "...",
  "standaloneQuestion": "...",
  "useHistory": true | false
}`;

    const intentResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: intentPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    let intentData: IntentResult = {
      intent: "portfolio_query",
      refinedQuery: trimmedMessage,
      standaloneQuestion: trimmedMessage,
      useHistory: false,
    };

    try {
      const parsed = JSON.parse(intentResult.response.text()) as Partial<IntentResult>;
      intentData = {
        intent:
          parsed.intent === "greeting" ||
          parsed.intent === "inappropriate" ||
          parsed.intent === "general_chat" ||
          parsed.intent === "portfolio_query"
            ? parsed.intent
            : "portfolio_query",
        refinedQuery:
          typeof parsed.refinedQuery === "string" && parsed.refinedQuery.trim()
            ? parsed.refinedQuery.trim()
            : trimmedMessage,
        standaloneQuestion:
          typeof parsed.standaloneQuestion === "string" &&
          parsed.standaloneQuestion.trim()
            ? parsed.standaloneQuestion.trim()
            : trimmedMessage,
        useHistory: Boolean(parsed.useHistory),
      };
    } catch (error) {
      console.error(
        "Failed to parse intent JSON, defaulting to portfolio_query",
        error,
      );
    }

    let contextBlocks: string[] = [];
    let sources: SourceItem[] = [];
    let contextText = "";
    const shouldSearch =
      intentData.intent === "portfolio_query" ||
      intentData.intent === "general_chat";

    if (shouldSearch) {
      const searchQueries = dedupeValues([
        intentData.standaloneQuestion,
        intentData.refinedQuery,
        trimmedMessage,
        ...(intentData.useHistory
          ? recentSourceHints
              .slice(0, 2)
              .map((source) => `${trimmedMessage} ${source.title}`)
          : []),
      ]);

      const similarChunks = await searchPortfolioChunks(searchQueries, locale);

      if (
        intentData.intent === "general_chat" &&
        similarChunks.some((chunk) => chunk.similarity >= PORTFOLIO_UPGRADE_THRESHOLD)
      ) {
        intentData.intent = "portfolio_query";
      }

      if (intentData.intent === "portfolio_query" && similarChunks.length > 0) {
        const fetchResult = await fetchMetadataForChunks(similarChunks, locale);
        contextBlocks = fetchResult.contextBlocks;
        sources = fetchResult.sources;
      }

      contextText =
        intentData.intent === "portfolio_query"
          ? contextBlocks.length > 0
            ? contextBlocks.join("\n\n")
            : "No relevant information found in the portfolio."
          : "";
    }

    let intentInstructions = "";
    if (intentData.intent === "greeting") {
      intentInstructions =
        "The user is greeting you. Respond warmly, keep it brief, and ask how you can help them explore Kadir's portfolio.";
    } else if (intentData.intent === "inappropriate") {
      intentInstructions =
        "The user sent an inappropriate or abusive message. Firmly but politely state that you cannot help with such requests.";
    } else if (intentData.intent === "general_chat") {
      intentInstructions =
        "The user asked a question unrelated to Kadir's portfolio. Politely explain that you are specialized in Kadir's portfolio, projects, blog posts, and professional background. Decline off-topic requests.";
    }

    const systemPrompt = `You are AutumnAI, an intelligent assistant embedded in Kadir's portfolio website.

ROLE:
- You answer questions about Kadir's portfolio, projects, blog posts, work experience, profile, and related technologies that appear in the portfolio.

NON-NEGOTIABLE RULES:
- PORTFOLIO CONTEXT is the only authoritative factual source.
- CONVERSATION HISTORY exists only to resolve follow-up references. Do not treat previous assistant replies as authoritative if they are not supported by the current PORTFOLIO CONTEXT.
- If the user changes topic, drop old source memory and answer the new topic from fresh context.
- Do not fabricate, guess, or hallucinate.
- If the context is insufficient, say exactly: "I don't have that information in my knowledge base."
- Never invent URLs, project names, dates, or technical details not present in the context.
- Use Markdown.
- When you mention a project or blog post that is directly relevant and present in the context, naturally include a markdown link using its PORTFOLIO URL.
- Do not force links for profile/work experience answers unless a project or blog post is directly relevant.

ANSWER LANGUAGE:
- ${locale === "tr" ? "Turkish (Turkce)" : "English"}

RECENT SOURCE MEMORY (only use this if the latest user message clearly refers back to one of them):
${recentSourceHintsText}

CONVERSATION HISTORY (reference only, not an authoritative source):
${historyText || "None"}

${intentInstructions ? `CURRENT INTENT INSTRUCTIONS:\n${intentInstructions}\n` : ""}${
      intentData.intent === "portfolio_query"
        ? `PORTFOLIO CONTEXT (authoritative; use only this for facts):\n${contextText}\n`
        : ""
    }
USER QUESTION:
${trimmedMessage}`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    const usageMetadata = result.response.usageMetadata ?? null;

    const relevantSources = dedupeSources(
      sources.filter(
        (source) =>
          (source.sourceType === "project" || source.sourceType === "blog") &&
          (source.similarity >= SOURCE_DISPLAY_THRESHOLD ||
            responseMentionsSource(response, source)),
      ),
    )
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 3);

    await db.insert(aiChatMessage).values({
      sessionId: sessionId!,
      role: "ai",
      content: response,
      metadata: {
        systemPrompt,
        usage: usageMetadata,
        sources: relevantSources.map(({ sourceType, title, url }) => ({
          sourceType,
          title,
          url,
        })),
      },
    });

    return NextResponse.json({ response, sources: relevantSources });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
