/**
 * Gemini language models selectable in Admin › AI Assistant.
 *
 * Prices: USD per 1M text tokens on the paid tier, from
 * https://ai.google.dev/gemini-api/docs/pricing (checked 2026-09-26).
 * Update this list when Google changes models or prices.
 */

export type ModelFamily = "pro" | "flash" | "flash-lite";

export interface ModelOption {
  id: string;
  label: string;
  family: ModelFamily;
  /** USD per 1M input tokens (paid tier). */
  input: number;
  /** USD per 1M output tokens (paid tier). */
  output: number;
  freeTier: boolean;
  /** Extra pricing detail shown under the select. */
  note?: { en: string; tr: string };
}

export const MODEL_PRICES_CHECKED_AT = "2026-09-26";

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    family: "flash",
    input: 0.75,
    output: 3.75,
    freeTier: true,
    note: {
      en: "Promotional price until 2026-12-31, then $1.50 / $7.50.",
      tr: "31.12.2026'ya kadar indirimli; sonra $1.50 / $7.50.",
    },
  },
  {
    id: "gemini-3.7-flash",
    label: "Gemini 3.7 Flash",
    family: "flash",
    input: 0.75,
    output: 3.75,
    freeTier: true,
    note: {
      en: "Promotional price until 2026-12-31, then $1.50 / $7.50.",
      tr: "31.12.2026'ya kadar indirimli; sonra $1.50 / $7.50.",
    },
  },
  {
    id: "gemini-3.6-flash",
    label: "Gemini 3.6 Flash",
    family: "flash",
    input: 0.75,
    output: 3.75,
    freeTier: true,
    note: {
      en: "Promotional price until 2026-12-31, then $1.50 / $7.50.",
      tr: "31.12.2026'ya kadar indirimli; sonra $1.50 / $7.50.",
    },
  },
  {
    id: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    family: "flash",
    input: 1.5,
    output: 9,
    freeTier: true,
  },
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    family: "flash-lite",
    input: 0.3,
    output: 2.5,
    freeTier: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash-Lite",
    family: "flash-lite",
    input: 0.25,
    output: 1.5,
    freeTier: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro (preview)",
    family: "pro",
    input: 2,
    output: 12,
    freeTier: false,
    note: {
      en: "Prompts over 200k tokens: $4.00 / $18.00. No free tier.",
      tr: "200k token üstü istemler: $4.00 / $18.00. Ücretsiz katman yok.",
    },
  },
];

export const DEFAULT_MODELS = {
  fast: "gemini-3.5-flash-lite",
  deep: "gemini-3.8-flash",
} as const;

export function findModel(id: string) {
  return GEMINI_MODELS.find((model) => model.id === id);
}

export function isKnownModel(id: string) {
  return Boolean(findModel(id));
}

/** Estimated USD cost of a token count for a model (paid-tier price). */
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number) {
  const model = findModel(modelId);
  if (!model) return null;
  return (inputTokens * model.input + outputTokens * model.output) / 1_000_000;
}
