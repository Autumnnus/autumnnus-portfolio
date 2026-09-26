import { runEvaluation } from "./run";

/**
 * Policy check that runs *before* the visitor is asked to approve sending a
 * message to the owner. Obvious spam / abuse is denied automatically; every
 * legitimate message still requires the visitor's explicit confirmation.
 */
export async function screenContactRequest(input: {
  message: string;
  replyTo: string;
  topic: string;
}): Promise<{ verdict: "ok" | "spam"; probability: number | null }> {
  const { answers } = await runEvaluation({
    state: input,
    questions: {
      spam: {
        type: "boolean",
        instructions:
          "Is this contact request spam, advertising, a scam, abusive, or clearly not a genuine message to a software developer?",
      },
    },
    latencySensitive: false,
    timeoutMs: 2_000,
  });

  if (!answers) return { verdict: "ok", probability: null };
  const probability = answers.spam.probability;
  return { verdict: probability >= 0.9 ? "spam" : "ok", probability };
}
