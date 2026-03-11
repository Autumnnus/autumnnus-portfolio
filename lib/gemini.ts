import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedGeminiApiKey: string | null = null;
let cachedGenAI: GoogleGenerativeAI | null = null;
let lastKeyUsed: string | null = null;

const GEMINI_KEY_FILE = path.join(
  process.cwd(),
  "data",
  "gemini-api-key.txt",
);

const readPersistedGeminiApiKey = (): string | null => {
  try {
    const stored = fs.readFileSync(GEMINI_KEY_FILE, "utf-8").trim();
    return stored || null;
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      return null;
    }
    console.warn("Failed to read persisted Gemini key override", error);
    return null;
  }
};

const persistGeminiApiKey = (value: string | null) => {
  try {
    if (!value) {
      fs.rmSync(GEMINI_KEY_FILE, { force: true });
      return;
    }
    fs.mkdirSync(path.dirname(GEMINI_KEY_FILE), { recursive: true });
    fs.writeFileSync(GEMINI_KEY_FILE, value, {
      encoding: "utf-8",
      mode: 0o600,
    });
  } catch (error) {
    console.warn("Failed to persist custom Gemini key", error);
  }
};

const getActiveGeminiApiKey = () => {
  if (cachedGeminiApiKey) {
    return cachedGeminiApiKey;
  }
  const persisted = readPersistedGeminiApiKey();
  if (persisted) {
    cachedGeminiApiKey = persisted;
    return persisted;
  }
  return process.env.GEMINI_API_KEY ?? null;
};

const logGeminiKeyUsage = (modelName: string, key: string) => {
  try {
    const logDir = path.join(process.cwd(), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, "gemini-requests.txt");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(
      logPath,
      `${timestamp} ${modelName} Gemini API key used: ${key}\n`,
    );
  } catch (error) {
    console.warn("Failed to log Gemini API key usage", { error });
  }
};

const ensureGenAI = (): { genAI: GoogleGenerativeAI; key: string } => {
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

  const genAI = cachedGenAI!;
  return { genAI, key };
};

const getGenerativeModel = (modelName: string) => {
  const { genAI, key } = ensureGenAI();
  logGeminiKeyUsage(modelName, key);
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
  persistGeminiApiKey(normalizedValue);
};

export const getCachedGeminiApiKey = () => {
  if (cachedGeminiApiKey) {
    return cachedGeminiApiKey;
  }
  cachedGeminiApiKey = readPersistedGeminiApiKey();
  return cachedGeminiApiKey;
};
