import { generateEmbedding } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";
import { searchSimilar } from "@/lib/vectordb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

const RATE_LIMIT_DAILY = 20;

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
    where: {
      ipAddress_date: {
        ipAddress: ip,
        date: today,
      },
    },
  });

  if (limitRecord && limitRecord.requestCount >= RATE_LIMIT_DAILY) {
    return false;
  }

  await prisma.chatRateLimit.upsert({
    where: {
      ipAddress_date: {
        ipAddress: ip,
        date: today,
      },
    },
    update: {
      requestCount: { increment: 1 },
    },
    create: {
      ipAddress: ip,
      date: today,
      requestCount: 1,
    },
  });

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const ip = await getClientIp(req);

    // Admins bypass rate limiting
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
    const { message, locale = "en" } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    // 1. Generate embedding for the question
    const queryEmbedding = await generateEmbedding(message);

    // 2. Search similar context
    const similarChunks = await searchSimilar(queryEmbedding, locale, 5, 0.6); // Threshold adjusted

    // 3. Build context string
    const contextText = similarChunks
      .map((chunk) => `[${chunk.sourceType}]: ${chunk.chunkText}`)
      .join("\n\n");

    // 4. Construct prompt for Gemini
    const systemPrompt = `You are an AI assistant for Kadir's Portfolio website.
    Your name is "AutumnAI". You are helpful, friendly, and professional.
    
    Use the following CONTEXT to answer the user's question.
    If the answer is not in the context, you can use your general knowledge but mention that it's general info.
    However, prioritize the context provided.
    
    Current User Locale: ${locale} (Answer in this language!)
    
    CONTEXT:
    ${contextText}
    
    USER QUESTION:
    ${message}
    `;

    // 5. Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
