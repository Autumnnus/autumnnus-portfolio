import "server-only";
import {
  GoogleGenerativeAI,
  type EmbedContentRequest,
  type EmbedContentResponse,
  type GenerateContentRequest,
  type GenerateContentResult,
  type GenerativeModel,
} from "@google/generative-ai";
import {
  blockGeminiQuotaGroup,
  getActiveGeminiRuntimeCandidates,
  getQuotaGroupBlockMap,
  markGeminiCredentialError,
  markGeminiCredentialSelected,
  markGeminiCredentialSuccess,
  selectGeminiRuntimeCandidate,
  type GeminiRuntimeCandidate,
} from "@/lib/ai/api-key-pool";
import { resolveGeminiRateLimit } from "@/lib/ai/gemini-rate-limit";

const clientCache = new Map<string, GoogleGenerativeAI>();

export class GeminiApiKeyPoolExhaustedError extends Error {
  status = 429;
  retryAfterSeconds: number | null;
  retryAt: string | null;

  constructor(nextAvailableAt: Date | null) {
    super(
      nextAvailableAt
        ? `All configured Gemini API keys are currently rate limited. Retry after ${nextAvailableAt.toISOString()}.`
        : "All configured Gemini API keys are currently rate limited.",
    );
    this.name = "GeminiApiKeyPoolExhaustedError";
    this.retryAt = nextAvailableAt ? nextAvailableAt.toISOString() : null;
    this.retryAfterSeconds = nextAvailableAt
      ? Math.max(
          1,
          Math.ceil((nextAvailableAt.getTime() - Date.now()) / 1000),
        )
      : null;
  }
}

function getGenerativeAiClient(apiKey: string) {
  const cached = clientCache.get(apiKey);
  if (cached) {
    return cached;
  }

  const client = new GoogleGenerativeAI(apiKey);
  clientCache.set(apiKey, client);
  return client;
}

function logGeminiKeyUsage(modelName: string, candidate: GeminiRuntimeCandidate) {
  console.info("Gemini API key selected", {
    modelName,
    keyId: candidate.id,
    label: candidate.label,
    fingerprint: candidate.keyFingerprint,
    category: candidate.category,
    quotaGroup: candidate.quotaGroup,
  });
}

function createModel(candidate: GeminiRuntimeCandidate, modelName: string) {
  logGeminiKeyUsage(modelName, candidate);
  return getGenerativeAiClient(candidate.apiKey).getGenerativeModel({
    model: modelName,
  });
}

export async function withGeminiModel<T>(
  modelName: string,
  task: (model: GenerativeModel, candidate: GeminiRuntimeCandidate) => Promise<T>,
) {
  const candidates = await getActiveGeminiRuntimeCandidates();
  if (candidates.length === 0) {
    throw new Error(
      "No active Gemini API keys are configured. Add at least one key in the admin panel.",
    );
  }

  const blockedUntilByQuotaGroup = await getQuotaGroupBlockMap(candidates);
  const excludedQuotaGroups = new Set<string>();

  while (true) {
    const selection = selectGeminiRuntimeCandidate(
      candidates,
      blockedUntilByQuotaGroup,
      excludedQuotaGroups,
    );

    if (!selection.key) {
      throw new GeminiApiKeyPoolExhaustedError(selection.nextAvailableAt);
    }

    const candidate = selection.key;
    await markGeminiCredentialSelected(candidate.id);

    try {
      const result = await task(createModel(candidate, modelName), candidate);
      await markGeminiCredentialSuccess(candidate.id, candidate.quotaGroup);
      return result;
    } catch (error) {
      await markGeminiCredentialError(candidate.id);
      const rateLimit = resolveGeminiRateLimit(error);
      if (!rateLimit?.isRateLimited) {
        throw error;
      }

      blockedUntilByQuotaGroup.set(candidate.quotaGroup, rateLimit.blockedUntil);
      excludedQuotaGroups.add(candidate.quotaGroup);
      await blockGeminiQuotaGroup({
        quotaGroup: candidate.quotaGroup,
        blockReason: rateLimit.blockReason,
        blockedUntil: rateLimit.blockedUntil,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }
  }
}

export async function generateGeminiContent(
  modelName: string,
  input: string | GenerateContentRequest,
): Promise<GenerateContentResult> {
  return withGeminiModel(modelName, (model) => model.generateContent(input));
}

export async function embedGeminiContent(
  input: string | EmbedContentRequest,
): Promise<EmbedContentResponse> {
  return withGeminiModel("gemini-embedding-001", (model) =>
    model.embedContent(input),
  );
}
