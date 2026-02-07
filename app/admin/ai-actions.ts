"use server";

import { auth } from "@/auth";

interface TranslationRequest {
  type: "blog" | "project" | "experience";
  sourceLang: "tr" | "en";
  targetLang: "tr" | "en";
  content: any;
}

export async function generateTranslationAction({
  type,
  sourceLang,
  targetLang,
  content,
}: TranslationRequest) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  try {
    let prompt = "";
    let dataStructure = "";

    if (type === "blog") {
      dataStructure = JSON.stringify({
        title: "Translated Title",
        description: "Translated Short Description",
        content: "Translated Markdown Content",
        readTime: "Translated Read Time (e.g. 5 min read)",
      });
      prompt = `You are a professional translator and SEO expert. Translate the following fields from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}.
      
      Source Content:
      ${JSON.stringify(content, null, 2)}
      
      Requirements:
      1. meaningful and SEO-friendly translations.
      2. Maintain the tone and style of the original content.
      3. For 'content' field, keep the Markdown formatting exactly as is, only translate the text.
      4. Return ONLY a valid JSON object matching this structure: ${dataStructure}
      5. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
    } else if (type === "project") {
      dataStructure = JSON.stringify({
        title: "Translated Title",
        shortDescription: "Translated Short Description",
        fullDescription: "Translated Full Markdown Description",
      });
      prompt = `You are a professional translator and technical writer. Translate the following project details from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}.
      
      Source Content:
      ${JSON.stringify(content, null, 2)}
      
      Requirements:
      1. Use technical terminology appropriate for software projects.
      2. For 'fullDescription', keep the Markdown formatting.
      3. Return ONLY a valid JSON object matching this structure: ${dataStructure}
      4. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
    } else if (type === "experience") {
      dataStructure = JSON.stringify({
        role: "Translated Role/Title",
        locationType: "Translated Location Type (e.g. Remote, Hybrid)",
        description: "Translated Markdown Description",
      });
      prompt = `You are a professional translator. Translate the following work experience details from ${sourceLang.toUpperCase()} to ${targetLang.toUpperCase()}.
      
      Source Content:
      ${JSON.stringify(content, null, 2)}
      
      Requirements:
      1. Use professional business terminology.
      2. For 'description', keep the Markdown formatting.
      3. Return ONLY a valid JSON object matching this structure: ${dataStructure}
      4. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up key formatting if present (e.g. ```json ... ```)
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("AI response was not valid JSON.");
    }
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Translation failed",
    );
  }
}
