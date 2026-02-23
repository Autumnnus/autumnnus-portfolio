"use server";

import { auth } from "@/auth";
import { languageNames } from "@/i18n/routing";

export interface BlogContent {
  title: string;
  description: string;
  content: string;
  readTime?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ProjectContent {
  title: string;
  shortDescription: string;
  fullDescription: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ExperienceContent {
  role: string;
  locationType: string;
  description: string;
}

export interface ProfileContent {
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

type TranslationRequest =
  | {
      type: "blog";
      sourceLang: string;
      targetLangs: string[];
      content: BlogContent;
    }
  | {
      type: "project";
      sourceLang: string;
      targetLangs: string[];
      content: ProjectContent;
    }
  | {
      type: "experience";
      sourceLang: string;
      targetLangs: string[];
      content: ExperienceContent;
    }
  | {
      type: "profile";
      sourceLang: string;
      targetLangs: string[];
      content: ProfileContent;
    };

export async function generateTranslationAction(params: TranslationRequest) {
  const { type, sourceLang, targetLangs, content } = params;
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
            content: "Translated HTML Content",
            readTime: "Translated Read Time (e.g. 5 min read)",
            excerpt: "Translated Excerpt/Summary",
            metaTitle: "Translated SEO Meta Title",
            metaDescription: "Translated SEO Meta Description",
            keywords: ["keyword1", "keyword2"],
          });
          prompt = `You are a professional translator and SEO expert. Translate the following fields from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
          Source Content:
          ${JSON.stringify(content, null, 2)}
          
          Requirements:
          1. Provide meaningful and SEO-friendly translations.
          2. Maintain the tone and style of the original content.
          3. **Crucial**: You MUST translate the entire 'content' field. This field contains **HTML**. You must translate all the text inside the HTML tags while keeping all the HTML tags (like <p>, <strong>, <a>, <img>, etc.) and attributes exactly where they are. Do not skip any sections of the content.
          4. Return ONLY a valid JSON object matching this structure: ${dataStructure}
          5. Do not include markdown code blocks or any other text in the response, just the raw JSON.`;
        } else if (type === "project") {
          dataStructure = JSON.stringify({
            title: "Translated Title",
            shortDescription: "Translated Short Description",
            fullDescription: "Translated Full Markdown Description",
            metaTitle: "Translated SEO Meta Title",
            metaDescription: "Translated SEO Meta Description",
            keywords: ["keyword1", "keyword2"],
          });
          prompt = `You are a professional translator and technical writer. Translate the following project details from ${sourceLangName} (${sourceLang}) to ${targetLangName} (${targetLang}).
          
          Source Content:
          ${JSON.stringify(content, null, 2)}
          
          Requirements:
          1. Use technical terminology appropriate for software projects.
          2. **Crucial**: You MUST translate the entire 'fullDescription' field (Markdown format), preserving all Markdown syntax. Do not skip any sections.
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

interface SeoRequest {
  type: "blog" | "project";
  content: string;
  language: string;
}

export async function generateSeoAction({
  type,
  content,
  language,
}: SeoRequest) {
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
    const langName = languageNames[language] || language;
    let prompt = "";
    let dataStructure = "";

    if (type === "blog") {
      dataStructure = JSON.stringify({
        title: "Main Title (50-60 chars)",
        excerpt: "Brief excerpt (120-150 chars)",
        metaTitle: "SEO Meta Title (50-60 chars)",
        metaDescription: "SEO Meta Description (150-160 chars)",
        keywords: ["keyword1", "keyword2", "keyword3"],
      });
      prompt = `You are an SEO expert. Analyze the following blog post context in ${langName} and generate comprehensive SEO-optimized content.
      
      Context:
      ${content.substring(0, 3000)}
      
      Requirements:
      1. **title**: Catchy main title for the blog post (50-60 characters)
      2. **excerpt**: Brief, engaging excerpt for previews (120-150 characters)
      3. **metaTitle**: SEO-optimized meta title (50-60 characters)
      4. **metaDescription**: SEO-optimized meta description with keywords (150-160 characters)
      5. **keywords**: Array of 3-5 relevant SEO keywords
      6. Language: ${langName}
      7. Return ONLY a valid JSON object matching this structure: ${dataStructure}
      8. Do not include markdown code blocks or any other text, just raw JSON.`;
    } else {
      dataStructure = JSON.stringify({
        title: "Project Title",
        shortDescription: "Short Description (max 160 chars)",
        metaTitle: "SEO Meta Title (50-60 chars)",
        metaDescription: "SEO Meta Description (150-160 chars)",
        keywords: ["keyword1", "keyword2", "keyword3"],
      });
      prompt = `You are an SEO expert. Analyze the following project description in ${langName} and generate SEO-optimized content.
      
      Context:
      ${content.substring(0, 3000)}
      
      Requirements:
      1. **title**: Professional, descriptive project title
      2. **shortDescription**: Highlight key features/tech stacks (max 160 characters)
      3. **metaTitle**: SEO-optimized meta title (50-60 characters)
      4. **metaDescription**: SEO-optimized meta description (150-160 characters)
      5. **keywords**: Array of 3-5 relevant SEO keywords
      6. Language: ${langName}
      7. Return ONLY a valid JSON object matching this structure: ${dataStructure}
      8. Do not include markdown code blocks or any other text, just raw JSON.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("SEO Generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "SEO Generation failed",
    );
  }
}
