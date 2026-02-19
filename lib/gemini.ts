import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const getGeminiModel = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
};

export const getEmbeddingModel = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI.getGenerativeModel({ model: "gemini-embedding-001" });
};
