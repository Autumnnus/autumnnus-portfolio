import "server-only";
import {
  FunctionCallingMode,
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
import {
  isGeminiTemporaryUnavailable,
  resolveGeminiRateLimit,
} from "@/lib/ai/gemini-rate-limit";

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

async function runRuntimeTracking(
  action: () => Promise<unknown>,
  context: { step: string; keyId: string; quotaGroup?: string },
) {
  try {
    await action();
  } catch (error) {
    console.warn("Gemini runtime tracking failed", {
      step: context.step,
      keyId: context.keyId,
      quotaGroup: context.quotaGroup,
      error,
    });
  }
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
  let lastTemporaryUnavailableError: unknown = null;

  while (true) {
    const selection = selectGeminiRuntimeCandidate(
      candidates,
      blockedUntilByQuotaGroup,
      excludedQuotaGroups,
    );

    if (!selection.key) {
      if (lastTemporaryUnavailableError) {
        throw lastTemporaryUnavailableError;
      }
      throw new GeminiApiKeyPoolExhaustedError(selection.nextAvailableAt);
    }

    const candidate = selection.key;
    await runRuntimeTracking(
      () => markGeminiCredentialSelected(candidate.id),
      {
        step: "selected",
        keyId: candidate.id,
        quotaGroup: candidate.quotaGroup,
      },
    );

    try {
      const result = await task(createModel(candidate, modelName), candidate);
      await runRuntimeTracking(
        () => markGeminiCredentialSuccess(candidate.id, candidate.quotaGroup),
        {
          step: "success",
          keyId: candidate.id,
          quotaGroup: candidate.quotaGroup,
        },
      );
      return result;
    } catch (error) {
      await runRuntimeTracking(
        () => markGeminiCredentialError(candidate.id),
        {
          step: "error",
          keyId: candidate.id,
          quotaGroup: candidate.quotaGroup,
        },
      );
      const rateLimit = resolveGeminiRateLimit(error);
      if (rateLimit?.isRateLimited) {
        blockedUntilByQuotaGroup.set(candidate.quotaGroup, rateLimit.blockedUntil);
        excludedQuotaGroups.add(candidate.quotaGroup);
        await runRuntimeTracking(
          () =>
            blockGeminiQuotaGroup({
              quotaGroup: candidate.quotaGroup,
              blockReason: rateLimit.blockReason,
              blockedUntil: rateLimit.blockedUntil,
              retryAfterSeconds: rateLimit.retryAfterSeconds,
            }),
          {
            step: "quota-block",
            keyId: candidate.id,
            quotaGroup: candidate.quotaGroup,
          },
        );
        continue;
      }

      if (isGeminiTemporaryUnavailable(error)) {
        lastTemporaryUnavailableError = error;
        excludedQuotaGroups.add(candidate.quotaGroup);
        continue;
      }

      throw error;
    }
  }
}

export async function generateGeminiContent(
  modelName: string,
  input: string | GenerateContentRequest,
): Promise<GenerateContentResult> {
  return withGeminiModel(modelName, (model) => model.generateContent(input));
}

export interface ToolCallRecord {
  name: string;
  response: object;
}

export interface ToolLoopResult {
  contentResult: GenerateContentResult;
  toolCalls: ToolCallRecord[];
}

export async function generateGeminiContentWithToolLoop(
  modelName: string,
  request: GenerateContentRequest,
  executeTool: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<object>,
  maxRounds = 3,
): Promise<ToolLoopResult> {
  let currentContents = [...request.contents];
  const allToolCalls: ToolCallRecord[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const result = await generateGeminiContent(modelName, {
      ...request,
      contents: currentContents,
    });

    const functionCalls = result.response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      return { contentResult: result, toolCalls: allToolCalls };
    }

    const functionResponses = await Promise.all(
      functionCalls.map(async (fc) => {
        const response = await executeTool(
          fc.name,
          (fc.args ?? {}) as Record<string, unknown>,
        );
        allToolCalls.push({ name: fc.name, response });
        return {
          functionResponse: { name: fc.name, response },
        };
      }),
    );

    currentContents = [
      ...currentContents,
      {
        role: "model" as const,
        parts: functionCalls.map((fc) => ({ functionCall: fc })),
      },
      {
        role: "function" as const,
        parts: functionResponses,
      },
    ];
  }

  const finalResult = await generateGeminiContent(modelName, {
    ...request,
    contents: currentContents,
    toolConfig: {
      functionCallingConfig: { mode: FunctionCallingMode.NONE },
    },
  });

  return { contentResult: finalResult, toolCalls: allToolCalls };
}

export async function embedGeminiContent(
  input: string | EmbedContentRequest,
): Promise<EmbedContentResponse> {
  return withGeminiModel("gemini-embedding-001", (model) =>
    model.embedContent(input),
  );
}
