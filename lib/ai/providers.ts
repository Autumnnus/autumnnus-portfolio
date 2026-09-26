import { createGateway } from "@ai-sdk/gateway";
import { createGoogle } from "@ai-sdk/google";
import { createTypeSafeAi } from "@ai-sdk/typesafe-ai";
import type { Experimental_EvaluationModel } from "ai";
import { AI_MODELS } from "./config";
import { DEFAULT_MODELS } from "./models";

/**
 * Provider wiring.
 *
 * - Language + embedding models: Google Gemini, called directly with the
 *   owner's API key (no gateway hop, free-tier friendly).
 * - Evaluation ("System One") model: Jev from TypeSafe AI, reached either with
 *   a direct TypeSafe key or through Vercel AI Gateway. When neither is set we
 *   can fall back to Gemini's structured-output evaluator for the steps where
 *   latency does not matter, or run without an evaluator at all.
 */

const google = createGoogle({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export function languageModel(modelId: string) {
  return google(modelId);
}

export function embeddingModel() {
  return google.embedding(AI_MODELS.embedding);
}

export type EvaluatorKind = "jev" | "gemini" | "off";

export interface ResolvedEvaluator {
  kind: Exclude<EvaluatorKind, "off">;
  model: Experimental_EvaluationModel;
  modelId: string;
}

let jevCache: ResolvedEvaluator | null | undefined;

function resolveJev(): ResolvedEvaluator | null {
  if (jevCache !== undefined) return jevCache;

  if (process.env.TYPESAFE_AI_API_KEY) {
    const typeSafe = createTypeSafeAi({
      apiKey: process.env.TYPESAFE_AI_API_KEY,
    });
    jevCache = {
      kind: "jev",
      model: typeSafe.evaluationModel(AI_MODELS.jevDirect),
      modelId: AI_MODELS.jevDirect,
    };
  } else if (process.env.AI_GATEWAY_API_KEY) {
    const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
    jevCache = {
      kind: "jev",
      model: gateway.evaluationModel(AI_MODELS.jevGateway),
      modelId: AI_MODELS.jevGateway,
    };
  } else {
    jevCache = null;
  }
  return jevCache;
}

function geminiFallbackEnabled() {
  return (
    Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) &&
    (process.env.AI_EVALUATOR_FALLBACK ?? "gemini") !== "off"
  );
}

/**
 * Picks the evaluator for a given step.
 *
 * `latencySensitive` steps (the pre-flight gate, in-loop retrieval judging)
 * only use Jev: an LLM-backed evaluator adds ~1s and its probabilities are
 * not calibrated, so for those we'd rather skip the step entirely.
 */
export function resolveEvaluator({
  latencySensitive,
}: {
  latencySensitive: boolean;
}): ResolvedEvaluator | null {
  const jev = resolveJev();
  if (jev) return jev;
  if (latencySensitive || !geminiFallbackEnabled()) return null;
  return {
    kind: "gemini",
    // Internal judge only — always the cheapest default flash-lite.
    model: google.evaluationModel(DEFAULT_MODELS.fast),
    modelId: DEFAULT_MODELS.fast,
  };
}

export function getAiProviderStatus() {
  const jev = resolveJev();
  return {
    llmConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    evaluator: (jev
      ? "jev"
      : geminiFallbackEnabled()
        ? "gemini"
        : "off") as EvaluatorKind,
    jevTransport: process.env.TYPESAFE_AI_API_KEY
      ? ("typesafe" as const)
      : process.env.AI_GATEWAY_API_KEY
        ? ("gateway" as const)
        : null,
    embeddingModel: AI_MODELS.embedding,
  };
}
