import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedGeminiApiKey: string | null = null;
let cachedGenAI: GoogleGenerativeAI | null = null;
let lastKeyUsed: string | null = null;

const getActiveGeminiApiKey = () =>
  cachedGeminiApiKey ?? process.env.GEMINI_API_KEY ?? null;

const ensureGenAI = () => {
  const key = getActiveGeminiApiKey();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Configure it in the environment or via the admin settings.",
    );
  }

  if (!cachedGenAI || lastKeyUsed !== key) {
    cachedGenAI = new GoogleGenerativeAI(key);
    lastKeyUsed = key;
  }

  return cachedGenAI;
};

const getGenerativeModel = (modelName: string) => {
  const genAI = ensureGenAI();
  return genAI.getGenerativeModel({ model: modelName });
};

export const getGeminiModel = () => getGenerativeModel("gemini-2.5-flash");

export const getGeminiFlashLiteModel = () =>
  getGenerativeModel("gemini-2.5-flash-lite");

export const getEmbeddingModel = () =>
  getGenerativeModel("gemini-embedding-001");

export const setCachedGeminiApiKey = (value: string | null) => {
  const normalizedValue = value?.trim() || null;
  if (normalizedValue === cachedGeminiApiKey) return;
  cachedGeminiApiKey = normalizedValue;
  cachedGenAI = null;
  lastKeyUsed = null;
};

export const getCachedGeminiApiKey = () => cachedGeminiApiKey;
