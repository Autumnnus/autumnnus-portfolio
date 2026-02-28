import { db } from "@/lib/db";
import { aiChatMessage, aiChatSession, chatRateLimit } from "@/lib/db/schema";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/vectordb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

const RATE_LIMIT_DAILY = 20;
const HISTORY_LIMIT = 10;

interface HistoryMessage {
  role: "user" | "ai";
  content: string;
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

interface FetchResult {
  contextBlocks: string[];
  sources: SourceItem[];
}

async function fetchMetadataForChunks(
  chunks: Awaited<ReturnType<typeof searchSimilar>>,
  locale: string,
): Promise<FetchResult> {
  const lang = locale === "tr" ? "tr" : "en";

  const maxSimilarityBySourceId = new Map<string, number>();
  for (const chunk of chunks) {
    const current = maxSimilarityBySourceId.get(chunk.sourceId) ?? 0;
    if (chunk.similarity > current) {
      maxSimilarityBySourceId.set(chunk.sourceId, chunk.similarity);
    }
  }

  const projectIds = [
    ...new Set(
      chunks.filter((c) => c.sourceType === "project").map((c) => c.sourceId),
    ),
  ];
  const blogIds = [
    ...new Set(
      chunks.filter((c) => c.sourceType === "blog").map((c) => c.sourceId),
    ),
  ];
  const profileIds = [
    ...new Set(
      chunks.filter((c) => c.sourceType === "profile").map((c) => c.sourceId),
    ),
  ];
  const experienceIds = [
    ...new Set(
      chunks
        .filter((c) => c.sourceType === "experience")
        .map((c) => c.sourceId),
    ),
  ];

  const [projects, blogs, profiles, experiences] = await Promise.all([
    projectIds.length > 0
      ? db.query.project.findMany({
          where: (p, { inArray }) => inArray(p.id, projectIds),
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
              where: (t, { eq }) => eq(t.language, lang === "tr" ? "tr" : "en"),
              columns: { title: true, shortDescription: true },
            },
          },
        })
      : [],
    blogIds.length > 0
      ? db.query.blogPost.findMany({
          where: (b, { inArray }) => inArray(b.id, blogIds),
          columns: {
            id: true,
            slug: true,
            tags: true,
            coverImage: true,
          },
          with: {
            category: { columns: { name: true } },
            translations: {
              where: (t, { eq }) => eq(t.language, lang === "tr" ? "tr" : "en"),
              columns: { title: true, description: true },
            },
          },
        })
      : [],
    profileIds.length > 0
      ? db.query.profile.findMany({
          where: (p, { inArray }) => inArray(p.id, profileIds),
          columns: {
            id: true,
            email: true,
            github: true,
            linkedin: true,
          },
          with: {
            translations: {
              where: (t, { eq }) => eq(t.language, lang === "tr" ? "tr" : "en"),
              columns: { name: true, title: true },
            },
          },
        })
      : [],
    experienceIds.length > 0
      ? db.query.workExperience.findMany({
          where: (e, { inArray }) => inArray(e.id, experienceIds),
          columns: {
            id: true,
            company: true,
            startDate: true,
            endDate: true,
          },
          with: {
            translations: {
              where: (t, { eq }) => eq(t.language, lang === "tr" ? "tr" : "en"),
              columns: { role: true, description: true, locationType: true },
            },
          },
        })
      : [],
  ]);

  const contextBlocks: string[] = [];
  const sources: SourceItem[] = [];

  for (const project of projects) {
    const translation = project.translations[0];
    const techs = (
      project.technologies as { skill: { name: string | null } | null }[]
    )
      .map((t) => t.skill?.name)
      .filter((name): name is string => !!name);
    const portfolioUrl = `/${lang}/projects/${project.slug}`;

    contextBlocks.push(
      [
        `--- SOURCE: project ---`,
        `TITLE: ${translation?.title ?? project.slug}`,
        `DESCRIPTION: ${translation?.shortDescription ?? ""}`,
        `PORTFOLIO URL: ${portfolioUrl}`,
        project.github ? `GITHUB: ${project.github}` : null,
        project.liveDemo ? `LIVE DEMO: ${project.liveDemo}` : null,
        project.category ? `CATEGORY: ${project.category.name}` : null,
        `STATUS: ${project.status}`,
        techs.length ? `TECHNOLOGIES: ${techs.join(", ")}` : null,
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
      similarity: maxSimilarityBySourceId.get(project.id) ?? 0,
    });
  }

  for (const blog of blogs) {
    const translation = blog.translations[0];
    const portfolioUrl = `/${lang}/blog/${blog.slug}`;

    contextBlocks.push(
      [
        `--- SOURCE: blog ---`,
        `TITLE: ${translation?.title ?? blog.slug}`,
        `DESCRIPTION: ${translation?.description ?? ""}`,
        `PORTFOLIO URL: ${portfolioUrl}`,
        blog.category ? `CATEGORY: ${blog.category.name}` : null,
        blog.tags?.length ? `TAGS: ${blog.tags.join(", ")}` : null,
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
      similarity: maxSimilarityBySourceId.get(blog.id) ?? 0,
    });
  }

  for (const profile of profiles) {
    const translation = profile.translations[0];

    contextBlocks.push(
      [
        `--- SOURCE: profile ---`,
        `NAME: ${translation?.name ?? ""}`,
        `TITLE: ${translation?.title ?? ""}`,
        profile.email ? `EMAIL: ${profile.email}` : null,
        profile.github ? `GITHUB: ${profile.github}` : null,
        profile.linkedin ? `LINKEDIN: ${profile.linkedin}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  for (const exp of experiences) {
    const translation = exp.translations[0];
    const startYear = exp.startDate ? exp.startDate.getFullYear() : "";
    const endYear = exp.endDate ? exp.endDate.getFullYear() : "Present";

    contextBlocks.push(
      [
        `--- SOURCE: experience ---`,
        `COMPANY: ${exp.company}`,
        `ROLE: ${translation?.role ?? ""}`,
        `LOCATION TYPE: ${translation?.locationType ?? ""}`,
        startYear ? `PERIOD: ${startYear} - ${endYear}` : null,
        `DESCRIPTION: ${translation?.description ?? ""}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return { contextBlocks, sources };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const ip = await getClientIp(req);

    let isAllowed = true;
    if (!isAdmin) {
      isAllowed = await checkRateLimit(ip);
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Daily message limit reached. Please try again tomorrow." },
        { status: 429 },
      );
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

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const recentSession = await db.query.aiChatSession.findFirst({
      where: (s, { eq }) => eq(s.ipAddress, ip),
      orderBy: (s, { desc }) => [desc(s.updatedAt)],
    });

    let sessionId = recentSession?.id;
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    if (
      !recentSession ||
      new Date().getTime() - recentSession.updatedAt.getTime() > TWO_HOURS_MS
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

    await db.insert(aiChatMessage).values({
      sessionId: sessionId!,
      role: "user",
      content: message,
    });

    const recentHistory = history.slice(-HISTORY_LIMIT);
    const historyText =
      recentHistory.length > 0
        ? recentHistory
            .map(
              (m) => `${m.role === "user" ? "User" : "AutumnAI"}: ${m.content}`,
            )
            .join("\n")
        : "";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const intentPrompt = `Analyze the user's message and the conversation history to determine the intent and a refined search query.
User Message: "${message}"

Recent History:
${historyText || "None"}

Intents:
- "greeting": The user is just saying hello, asking how you are, thanking you, or saying goodbye.
- "inappropriate": The user is asking an inappropriate question, using profanity, or being abusive.
- "general_chat": ONLY use this for questions that are CLEARLY and OBVIOUSLY unrelated to any tech portfolio. Examples: weather, jokes, cooking recipes, politics, sports scores, romantic advice. Do NOT use this for any technology name, tool, framework, library, programming concept, or career topic — those might exist in the portfolio.
- "portfolio_query": The user is asking about Kadir's portfolio, projects, experience, skills, blog posts, contact info, OR asking about any technology/tool/framework (e.g. "what is Drizzle", "tell me about TypeScript") since these may appear in portfolio projects or blog posts. When in doubt, use this.

If the intent is "portfolio_query", provide a "refinedQuery" which is an optimized, keyword-rich search string in English useful for a vector database search.
Return JSON in this format: { "intent": "greeting"|"inappropriate"|"general_chat"|"portfolio_query", "refinedQuery": "..." }`;

    const intentResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: intentPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    let intentData = { intent: "portfolio_query", refinedQuery: message };
    try {
      intentData = JSON.parse(intentResult.response.text());
    } catch (e) {
      console.error(
        "Failed to parse intent JSON, defaulting to portfolio_query",
        e,
      );
    }

    let contextBlocks: string[] = [];
    let sources: SourceItem[] = [];
    let contextText = "";

    const shouldSearch =
      intentData.intent === "portfolio_query" ||
      intentData.intent === "general_chat";

    if (shouldSearch) {
      const queryEmbedding = await generateEmbedding(
        intentData.refinedQuery || message,
      );
      const similarChunks = await searchSimilar(
        queryEmbedding,
        locale,
        8,
        0.55,
      );

      const PORTFOLIO_UPGRADE_THRESHOLD = 0.65;
      if (
        intentData.intent === "general_chat" &&
        similarChunks.some((c) => c.similarity >= PORTFOLIO_UPGRADE_THRESHOLD)
      ) {
        intentData.intent = "portfolio_query";
      }

      if (intentData.intent === "portfolio_query" && similarChunks.length > 0) {
        const result = await fetchMetadataForChunks(similarChunks, locale);
        contextBlocks = result.contextBlocks;
        sources = result.sources;
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
        "The user is greeting you. Respond warmly, acknowledge the conversation, and ask how you can help them explore Kadir's portfolio.";
    } else if (intentData.intent === "inappropriate") {
      intentInstructions =
        "The user sent an inappropriate or abusive message. Firmly but politely state that you cannot help with such requests.";
    } else if (intentData.intent === "general_chat") {
      intentInstructions =
        "The user asked a general question unrelated to the portfolio. Politely explain that you are specialized in answering questions about Kadir's portfolio, projects, and professional background. Decline to answer general knowledge, coding help, or off-topic queries.";
    }

    const systemPrompt = `You are AutumnAI, an intelligent assistant embedded in Kadir's portfolio website.

ROLE & RESTRICTIONS:
- You ONLY answer questions about Kadir's portfolio: his projects, blog posts, work experience, skills, and profile.
- If a question is NOT related to Kadir's portfolio (e.g. weather, general coding help, politics, daily life), politely decline and redirect the user to ask about the portfolio.
- Do NOT fabricate, guess, or hallucinate. If the CONTEXT does not contain enough information, say: "I don't have that information in my knowledge base."
- Never invent URLs, project names, or details not found in the CONTEXT.
- Use Markdown for formatting: bullet lists, bold text, inline links.
- When mentioning a project or blog post, include its name as a clickable link using the PORTFOLIO URL. Keep it natural — do NOT repeat the full URL or image separately, those are handled by the UI.
- The UI will display source cards automatically. Only link to a project or blog post if it is DIRECTLY relevant to the user's question. Do NOT reference projects or blog posts when the question is about work experience, personal info, or profile.
- Answer in: ${locale === "tr" ? "Turkish (Türkçe)" : "English"}.
${historyText ? `\nCONVERSATION HISTORY:\n${historyText}\n` : ""}

${intentInstructions ? `CURRENT INTENT INSTRUCTIONS:\n${intentInstructions}\n` : ""}
${intentData.intent === "portfolio_query" ? `PORTFOLIO CONTEXT (use ONLY this to answer):\n${contextText}\n` : ""}

USER QUESTION:
${message}`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    const usageMetadata = result.response.usageMetadata ?? null;

    await db.insert(aiChatMessage).values({
      sessionId: sessionId!,
      role: "ai",
      content: response,
      metadata: {
        systemPrompt: systemPrompt,
        usage: usageMetadata,
      },
    });

    const SOURCE_DISPLAY_THRESHOLD = 0.7;
    const relevantSources = sources
      .filter(
        (s) =>
          (s.sourceType === "project" || s.sourceType === "blog") &&
          s.similarity >= SOURCE_DISPLAY_THRESHOLD,
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

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
