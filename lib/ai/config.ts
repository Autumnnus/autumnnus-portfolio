/**
 * Central, env-driven configuration for the AI assistant.
 *
 * Everything that is a *product decision* (budgets, thresholds, limits) lives
 * here so it can be tuned in one place and referenced from evals.
 */

/**
 * Chat models (fast / deep tier) are chosen in Admin › AI Assistant and
 * stored in AssistantSettings — see lib/ai/models.ts for the catalog.
 * The embedding model is fixed: changing it requires a full re-index.
 */
export const AI_MODELS = {
  embedding: "gemini-embedding-001",
  /** Jev model ids for the two supported transports. */
  jevDirect: "jev-latest",
  jevGateway: "typesafe-ai/jev",
} as const;

export type ModelTier = "fast" | "deep";

export const AGENT_LIMITS = {
  /** Hard ceiling on LLM steps per turn (tool calls + final answer). */
  maxSteps: 8,
  /** From this step on, tools are disabled so the model must answer. */
  answerOnlyFromStep: 6,
  totalTimeoutMs: 60_000,
  stepTimeoutMs: 25_000,
  toolTimeoutMs: 8_000,
  maxOutputTokens: 1_400,
} as const;

export const CHAT_LIMITS = {
  maxUserMessageChars: 1_500,
  /** Messages kept per thread (user + assistant). Older turns are trimmed. */
  maxStoredMessagesPerThread: 40,
  /** Turns of history sent to the model (older ones stay only in storage). */
  maxContextMessages: 16,
  /** Max chars of tool output persisted per tool part (UI keeps the cards). */
  maxPersistedToolOutputChars: 4_000,
} as const;

export const RETRIEVAL = {
  /** Candidates pulled from each first-stage retriever. */
  lexicalK: 30,
  vectorK: 30,
  /** Pool size sent to the Jev relevance judge after first-stage fusion. */
  judgePoolSize: 16,
  /** Results handed to the LLM. */
  defaultLimit: 6,
  maxChunksPerDocument: 2,
  /** Reciprocal-rank-fusion constant (Cormack et al. use 60). */
  rrfK: 60,
  /** Judge probabilities below this are dropped (kept if we'd go below minKeep). */
  judgeDropBelow: 0.15,
  minKeep: 2,
  judgeTimeoutMs: 1_800,
} as const;

export const CHUNKING = {
  targetTokens: 450,
  maxTokens: 700,
  overlapTokens: 60,
} as const;

export const GATE = {
  timeoutMs: 900,
  /** P(abuse) at or above this short-circuits with a canned reply. */
  abuseBlock: 0.9,
  /** P(injection) at or above this switches the agent into strict mode. */
  injectionStrict: 0.8,
  /** P(off_topic) at or above this answers without tools on the fast model. */
  offTopicNoTools: 0.85,
  /** Complexity score (0‥2) at or above this upgrades to the deep model. */
  deepTierScore: 1.15,
} as const;

export const ATTRIBUTION = {
  timeoutMs: 2_500,
  /** P(used) at or above this marks an uncited search hit as a source. */
  usedThreshold: 0.6,
} as const;

/** Locales the assistant answers in. Content in other languages is ignored. */
export const ASSISTANT_LOCALES = ["tr", "en"] as const;
export type AssistantLocale = (typeof ASSISTANT_LOCALES)[number];

export function toAssistantLocale(value: string | undefined): AssistantLocale {
  return value === "en" ? "en" : "tr";
}
