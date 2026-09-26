import type { Experimental_EvaluationQuestion } from "ai";
import { RETRIEVAL } from "../config";
import { runEvaluation, type EvaluationTrace } from "./run";

/**
 * Relevance judge for retrieval candidates.
 *
 * "Inline" layout, as used in public Jev rerank benchmarks: the visitor's
 * question lives in the shared state and every candidate passage is its own
 * Boolean question. Jev answers them independently and in parallel in one
 * request, returning P(relevant) per passage.
 *
 * The result is *fused* with the first-stage ranking by the caller — Jev as
 * a standalone reranker does not reliably beat a good embedding ranker, but
 * the fusion does.
 */

export interface JudgeCandidate {
  id: string;
  title: string;
  heading: string | null;
  content: string;
}

const CRITERIA = {
  true: "The passage states facts that directly answer the question or clearly support an answer to it.",
  false:
    "The passage is off-topic, only shares words with the question without answering it, or is too vague to help.",
};

export async function judgeRelevance({
  question,
  query,
  candidates,
  abortSignal,
}: {
  question: string;
  query: string;
  candidates: JudgeCandidate[];
  abortSignal?: AbortSignal;
}): Promise<{ probabilities: Map<string, number> | null; trace: EvaluationTrace }> {
  if (!candidates.length) {
    return { probabilities: null, trace: { provider: "off", ms: 0, ok: false } };
  }

  const questions: Record<string, Experimental_EvaluationQuestion> = {};
  candidates.forEach((candidate, index) => {
    questions[`p${index}`] = {
      type: "boolean",
      instructions: {
        task: "Does this passage help answer the visitor's `question`?",
        passage: {
          title: candidate.title,
          section: candidate.heading,
          text: candidate.content.slice(0, 2_400),
        },
      },
      criteria: CRITERIA,
    };
  });

  const { answers, trace } = await runEvaluation({
    state: { question, searchQuery: query },
    questions,
    latencySensitive: true,
    timeoutMs: RETRIEVAL.judgeTimeoutMs,
    abortSignal,
  });

  if (!answers) return { probabilities: null, trace };

  const probabilities = new Map<string, number>();
  candidates.forEach((candidate, index) => {
    const answer = answers[`p${index}`];
    if (answer?.type === "boolean") probabilities.set(candidate.id, answer.probability);
  });
  return { probabilities, trace };
}
