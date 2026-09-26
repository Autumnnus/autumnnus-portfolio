import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationQuestion,
  type Experimental_EvaluationResult,
} from "ai";
import { resolveEvaluator, type EvaluatorKind } from "../providers";

/**
 * The "System One" layer: fast, typed decisions (Choice / Score / Boolean)
 * made by an evaluation model — Jev when configured.
 *
 * Every call is wrapped so that it can never break the chat: a timeout,
 * provider error or missing configuration returns `answers: null` and the
 * caller falls back to its deterministic default ("fail open").
 */

type Questions = Record<string, Experimental_EvaluationQuestion>;

export interface EvaluationTrace {
  provider: EvaluatorKind;
  modelId?: string;
  ms: number;
  inputTokens?: number;
  ok: boolean;
  error?: string;
}

export interface EvaluationOutcome<Q extends Questions> {
  answers: Experimental_EvaluationResult<Q>["answers"] | null;
  trace: EvaluationTrace;
}

export async function runEvaluation<const Q extends Questions>({
  state,
  questions,
  latencySensitive,
  timeoutMs,
  abortSignal,
}: {
  state: Parameters<typeof evaluate>[0]["state"];
  questions: Q;
  latencySensitive: boolean;
  timeoutMs: number;
  abortSignal?: AbortSignal;
}): Promise<EvaluationOutcome<Q>> {
  const evaluator = resolveEvaluator({ latencySensitive });
  if (!evaluator) {
    return { answers: null, trace: { provider: "off", ms: 0, ok: false } };
  }

  const startedAt = performance.now();
  const signals = [AbortSignal.timeout(timeoutMs)];
  if (abortSignal) signals.push(abortSignal);

  try {
    const result = await evaluate({
      model: evaluator.model,
      state,
      questions,
      maxRetries: latencySensitive ? 0 : 1,
      abortSignal: AbortSignal.any(signals),
    });
    return {
      answers: result.answers,
      trace: {
        provider: evaluator.kind,
        modelId: evaluator.modelId,
        ms: Math.round(performance.now() - startedAt),
        inputTokens: result.usage.inputTokens,
        ok: true,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[system-one] ${evaluator.kind} evaluation failed:`, message);
    return {
      answers: null,
      trace: {
        provider: evaluator.kind,
        modelId: evaluator.modelId,
        ms: Math.round(performance.now() - startedAt),
        ok: false,
        error: message.slice(0, 200),
      },
    };
  }
}
