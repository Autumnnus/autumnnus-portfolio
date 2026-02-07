"use server";

import { auth } from "@/auth";
import { languageNames } from "@/i18n/routing";

interface BlogContent {
  title: string;
  description: string;
  content: string;
  readTime?: string;
}

interface ProjectContent {
  title: string;
  shortDescription: string;
  fullDescription: string;
}

interface ExperienceContent {
  role: string;
  locationType: string;
  description: string;
}

interface ProfileContent {
  name: string;
  title: string;
  greetingText: string;
  description: string;
  aboutTitle: string;
  aboutDescription: string;
}

type Content =
  | BlogContent
  | ProjectContent
  | ExperienceContent
  | ProfileContent;

interface TranslationRequest {
  type: "blog" | "project" | "experience" | "profile";
  sourceLang: string;
  targetLangs: string[];
  content: Content;
}

export async function generateTranslationAction({
  type,
  sourceLang,
  targetLangs,
  content,
}: TranslationRequest) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  try {
    const results: Record<string, Content | null> = {};
    const sourceLangName = languageNames[sourceLang] || sourceLang;

    await Promise.all(
      targetLangs.map(async (targetLang) => {
        const targetLangName = languageNames[targetLang] || targetLang;

        let prompt = "";
        let dataStructure = "";

        if (type === "blog") {
          dataStructure = JSON.stringify({
            title: "Translated Title",
            description: "Translated Short Description",
            content: "Translated Markdown Content",
            readTime: "Translated Read Time (e.g. 5 min read)",
          });
          prompt = `You are a professional translator and SEO expert. Translate the following fields from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
          Source Content:
          ${JSON.stringify(content, null, 2)}
          
          Requirements:
          1. Meaningful and SEO-friendly translations.
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
          prompt = `You are a professional translator and technical writer. Translate the following project details from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
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
          prompt = `You are a professional translator. Translate the following work experience details from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
          Source Content:
          ${JSON.stringify(content, null, 2)}
          
          Requirements:
          1. Use professional business terminology.
          2. For 'description', keep the Markdown formatting.
          3. Return ONLY a valid JSON object matching this structure: ${dataStructure}
          4. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
        } else if (type === "profile") {
          dataStructure = JSON.stringify({
            name: "Name (usually same, translate only if necessary)",
            title: "Professional Title",
            greetingText: "Greeting Text",
            description: "Hero Description",
            aboutTitle: "About Section Title",
            aboutDescription: "About Description (Markdown)",
          });
          prompt = `You are a professional translator. Translate the following profile details from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
          Source Content:
          ${JSON.stringify(content, null, 2)}
          
          Requirements:
          1. Use professional and engaging tone.
          2. For 'aboutDescription', keep the Markdown formatting.
          3. Ensure the 'name' is transliterated or kept as is depending on target language conventions, but usually kept as is.
          4. Return ONLY a valid JSON object matching this structure: ${dataStructure}
          5. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
        }

        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
          results[targetLang] = JSON.parse(cleanedText) as Content;
        } catch (error) {
          console.error(`Translation failed for ${targetLang}:`, error);
          results[targetLang] = null;
        }
      }),
    );

    return results;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Translation failed",
    );
  }
}
