import type { Experimental_EvaluationQuestion } from "ai";
import { ATTRIBUTION } from "../config";
import { runEvaluation, type EvaluationTrace } from "./run";

/**
 * Post-answer source attribution.
 *
 * Search hits the model did not cite explicitly are checked with one
 * Boolean per source: "does the answer use information from this source?".
 * Runs after the text has streamed, so it is not latency-sensitive and may
 * use the Gemini evaluator fallback when Jev is not configured.
 */

export interface AttributionCandidate {
  ref: string;
  title: string;
  content: string;
}

export async function attributeSources({
  answer,
  candidates,
  abortSignal,
}: {
  answer: string;
  candidates: AttributionCandidate[];
  abortSignal?: AbortSignal;
}): Promise<{ used: Set<string> | null; trace: EvaluationTrace | null }> {
  if (!candidates.length || answer.trim().length < 40) {
    return { used: null, trace: null };
  }

  const questions: Record<string, Experimental_EvaluationQuestion> = {};
  candidates.forEach((candidate, index) => {
    questions[`s${index}`] = {
      type: "boolean",
      instructions: {
        task: "Does the assistant's `answer` use information that comes from this source?",
        source: { title: candidate.title, text: candidate.content.slice(0, 1_600) },
      },
      criteria: {
        true: "At least one statement in the answer is based on this source.",
        false: "The answer does not rely on anything specific to this source.",
      },
    };
  });

  const { answers, trace } = await runEvaluation({
    state: { answer: answer.slice(0, 6_000) },
    questions,
    latencySensitive: false,
    timeoutMs: ATTRIBUTION.timeoutMs,
    abortSignal,
  });

  if (!answers) return { used: null, trace: trace.provider === "off" ? null : trace };

  const used = new Set<string>();
  candidates.forEach((candidate, index) => {
    const answerForSource = answers[`s${index}`];
    if (
      answerForSource?.type === "boolean" &&
      answerForSource.probability >= ATTRIBUTION.usedThreshold
    ) {
      used.add(candidate.ref);
    }
  });
  return { used, trace };
}
