import { generateEmbedding } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";
import { searchSimilar } from "@/lib/vectordb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";
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

  const limitRecord = await prisma.chatRateLimit.findUnique({
    where: { ipAddress_date: { ipAddress: ip, date: today } },
  });

  if (limitRecord && limitRecord.requestCount >= RATE_LIMIT_DAILY) {
    return false;
  }

  await prisma.chatRateLimit.upsert({
    where: { ipAddress_date: { ipAddress: ip, date: today } },
    update: { requestCount: { increment: 1 } },
    create: { ipAddress: ip, date: today, requestCount: 1 },
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
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: {
            id: true,
            slug: true,
            github: true,
            liveDemo: true,
            category: true,
            status: true,
            coverImage: true,
            technologies: { select: { name: true } },
            translations: {
              where: { language: lang === "tr" ? "tr" : "en" },
              select: { title: true, shortDescription: true },
            },
          },
        })
      : [],
    blogIds.length > 0
      ? prisma.blogPost.findMany({
          where: { id: { in: blogIds } },
          select: {
            id: true,
            slug: true,
            category: true,
            tags: true,
            coverImage: true,
            translations: {
              where: { language: lang === "tr" ? "tr" : "en" },
              select: { title: true, description: true },
            },
          },
        })
      : [],
    profileIds.length > 0
      ? prisma.profile.findMany({
          where: { id: { in: profileIds } },
          select: {
            id: true,
            email: true,
            github: true,
            linkedin: true,
            translations: {
              where: { language: lang === "tr" ? "tr" : "en" },
              select: { name: true, title: true },
            },
          },
        })
      : [],
    experienceIds.length > 0
      ? prisma.workExperience.findMany({
          where: { id: { in: experienceIds } },
          select: {
            id: true,
            company: true,
            startDate: true,
            endDate: true,
            translations: {
              where: { language: lang === "tr" ? "tr" : "en" },
              select: { role: true, description: true, locationType: true },
            },
          },
        })
      : [],
  ]);

  const contextBlocks: string[] = [];
  const sources: SourceItem[] = [];

  for (const project of projects) {
    const translation = project.translations[0];
    const techs = project.technologies.map((t) => t.name);
    const portfolioUrl = `/${lang}/projects/${project.slug}`;

    contextBlocks.push(
      [
        `--- SOURCE: project ---`,
        `TITLE: ${translation?.title ?? project.slug}`,
        `DESCRIPTION: ${translation?.shortDescription ?? ""}`,
        `PORTFOLIO URL: ${portfolioUrl}`,
        project.github ? `GITHUB: ${project.github}` : null,
        project.liveDemo ? `LIVE DEMO: ${project.liveDemo}` : null,
        `CATEGORY: ${project.category}`,
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
      category: project.category,
      technologies: techs,
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
        blog.category ? `CATEGORY: ${blog.category}` : null,
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
      category: blog.category ?? undefined,
      tags: blog.tags ?? [],
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

    // Find or create AI Chat Session for this IP
    const recentSession = await prisma.aiChatSession.findFirst({
      where: { ipAddress: ip },
      orderBy: { updatedAt: "desc" },
    });

    let sessionId = recentSession?.id;
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    if (
      !recentSession ||
      new Date().getTime() - recentSession.updatedAt.getTime() > TWO_HOURS_MS
    ) {
      const newSession = await prisma.aiChatSession.create({
        data: { ipAddress: ip },
      });
      sessionId = newSession.id;
    } else {
      // Update the session's updatedAt timestamp
      await prisma.aiChatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Log the user's message
    await prisma.aiChatMessage.create({
      data: {
        sessionId: sessionId!,
        role: "user",
        content: message,
      },
    });

    const queryEmbedding = await generateEmbedding(message);
    const similarChunks = await searchSimilar(queryEmbedding, locale, 8, 0.55);

    const { contextBlocks, sources } =
      similarChunks.length > 0
        ? await fetchMetadataForChunks(similarChunks, locale)
        : { contextBlocks: [], sources: [] };

    const contextText =
      contextBlocks.length > 0
        ? contextBlocks.join("\n\n")
        : "No relevant information found in the portfolio.";

    const recentHistory = history.slice(-HISTORY_LIMIT);
    const historyText =
      recentHistory.length > 0
        ? recentHistory
            .map(
              (m) => `${m.role === "user" ? "User" : "AutumnAI"}: ${m.content}`,
            )
            .join("\n")
        : "";

    const systemPrompt = `You are AutumnAI, an intelligent assistant embedded in Kadir's portfolio website.

ROLE & RESTRICTIONS:
- You ONLY answer questions about Kadir's portfolio: his projects, blog posts, work experience, skills, and profile.
- If a question is NOT related to Kadir's portfolio (e.g. weather, general coding help, politics, daily life), politely decline and redirect the user to ask about the portfolio.
- Do NOT fabricate, guess, or hallucinate. If the CONTEXT does not contain enough information, say: "I don't have that information in my knowledge base."
- Never invent URLs, project names, or details not found in the CONTEXT.
- Use Markdown for formatting: bullet lists, bold text, inline links.
- When mentioning a project or blog post, include its name as a clickable link using the PORTFOLIO URL. Keep it natural — do NOT repeat the full URL or image separately, those are handled by the UI.
- Answer in: ${locale === "tr" ? "Turkish (Türkçe)" : "English"}.
${historyText ? `\nCONVERSATION HISTORY:\n${historyText}\n` : ""}

PORTFOLIO CONTEXT (use ONLY this to answer):
${contextText}

USER QUESTION:
${message}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    let usageMetadata = null;
    try {
      usageMetadata = result.response.usageMetadata;
    } catch (_e) {
      // ignore
    }

    await prisma.aiChatMessage.create({
      data: {
        sessionId: sessionId!,
        role: "ai",
        content: response,
        metadata: {
          systemPrompt: systemPrompt,
          usage: usageMetadata as unknown as Prisma.InputJsonValue,
        },
      },
    });

    // Only return sources when they are genuinely relevant (project or blog)
    const relevantSources = sources.filter(
      (s) => s.sourceType === "project" || s.sourceType === "blog",
    );

    return NextResponse.json({ response, sources: relevantSources });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
