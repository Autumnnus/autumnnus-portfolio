import {
  isStepCount,
  pruneMessages,
  ToolLoopAgent,
  type InferUITools,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { AGENT_LIMITS } from "../config";
import { toolApprovalSecret } from "../chat/identity";
import { pageContextSchema } from "../chat/page-context";
import { DEFAULT_MODELS } from "../models";
import { languageModel } from "../providers";
import { screenContactRequest } from "../system-one/contact-screen";
import { getOwnerIdentity } from "./data";
import { buildInstructions, INSTRUCTIONS_VERSION } from "./instructions";
import { assistantTools, type AssistantToolName, type AssistantTools } from "./tools";

/**
 * "Autumn" — the portfolio agent.
 *
 * Loop design
 * ───────────
 *  prepareCall (once per request)
 *    · model tier chosen upstream by the Jev gate (fast ⇄ deep)
 *    · instructions built for locale, page and gate mode (normal/strict/no-tools)
 *    · per-tool context (locale, question, visitor) injected server-side —
 *      the model can never see or forge it
 *  prepareStep (before every step)
 *    · step 0: compact history (drop old tool payloads & reasoning)
 *    · step ≥ answerOnlyFromStep: tools disabled → the model must answer
 *  stopWhen: hard ceiling of maxSteps
 *  toolApproval: contactOwner → System One spam screen → user approval,
 *    HMAC-signed so a client cannot forge an approval
 */

export const assistantCallOptionsSchema = z.object({
  locale: z.enum(["tr", "en"]),
  tier: z.enum(["fast", "deep"]),
  /** Gemini model id for this request (from admin settings). */
  modelId: z.string(),
  mode: z.enum(["normal", "strict", "no-tools", "blocked"]),
  question: z.string(),
  page: pageContextSchema.nullable(),
  visitorKey: z.string(),
  threadId: z.string(),
});

export type AssistantCallOptions = z.infer<typeof assistantCallOptionsSchema>;

function buildToolsContext(options: Pick<
  AssistantCallOptions,
  "locale" | "question" | "visitorKey" | "threadId" | "page"
>) {
  const localeContext = { locale: options.locale };
  return {
    searchKnowledge: { locale: options.locale, question: options.question },
    listProjects: localeContext,
    getProject: localeContext,
    listPosts: localeContext,
    getPost: localeContext,
    getCareer: localeContext,
    getProfile: localeContext,
    getSiteGuide: localeContext,
    contactOwner: {
      visitorKey: options.visitorKey,
      threadId: options.threadId,
      pagePath: options.page?.path ?? null,
    },
  };
}

/**
 * Per-step loop policy (exported for tests):
 * step 0 compacts history, late steps must answer without tools.
 */
export function preparePortfolioStep({
  stepNumber,
  messages,
}: {
  stepNumber: number;
  messages: ModelMessage[];
}): { messages?: ModelMessage[]; activeTools?: AssistantToolName[] } {
  if (stepNumber === 0) {
    return {
      messages: pruneMessages({
        messages,
        reasoning: "all",
        toolCalls: "before-last-4-messages",
        emptyMessages: "remove",
      }),
    };
  }
  if (stepNumber >= AGENT_LIMITS.answerOnlyFromStep) {
    return { activeTools: [] };
  }
  return {};
}

export const portfolioAgent = new ToolLoopAgent({
  id: "autumn",
  model: languageModel(DEFAULT_MODELS.fast),
  tools: assistantTools,
  callOptionsSchema: assistantCallOptionsSchema,
  stopWhen: isStepCount(AGENT_LIMITS.maxSteps),
  maxOutputTokens: AGENT_LIMITS.maxOutputTokens,
  // No temperature override: Gemini 3 models are tuned for the default and
  // can loop at low temperatures.
  maxRetries: 1,
  // Placeholder only — prepareCall always replaces it with request values.
  toolsContext: buildToolsContext({
    locale: "tr",
    question: "",
    visitorKey: "",
    threadId: "",
    page: null,
  }),

  prepareCall: async ({ options, ...settings }) => {
    const owner = await getOwnerIdentity(options.locale);

    return {
      ...settings,
      model: languageModel(options.modelId),
      reasoning: options.tier === "deep" ? "low" : "minimal",
      instructions: buildInstructions({
        owner,
        locale: options.locale,
        page: options.page,
        mode: options.mode,
        today: new Date().toISOString().slice(0, 10),
      }),
      activeTools: options.mode === "no-tools" ? [] : undefined,
      experimental_toolApprovalSecret: toolApprovalSecret(),
      toolApproval: {
        contactOwner: async (input) => {
          const { verdict } = await screenContactRequest(input);
          return verdict === "spam"
            ? {
                type: "denied" as const,
                reason: "The message was flagged as spam or abuse.",
              }
            : "user-approval";
        },
      },
      runtimeContext: {
        tier: options.tier,
        mode: options.mode,
        instructionsVersion: INSTRUCTIONS_VERSION,
      },
      toolsContext: buildToolsContext(options),
    };
  },

  prepareStep: preparePortfolioStep,
});

// ─── UI message contract ─────────────────────────────────────────────────────

export interface AssistantMessageMetadata {
  createdAt?: number;
  model?: string;
  tier?: "fast" | "deep";
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  steps?: number;
  instructionsVersion?: string;
}

export interface RouteDataPart {
  tier: "fast" | "deep";
  model: string;
  mode: "normal" | "strict" | "no-tools" | "blocked";
  intent: string;
  source: "evaluator" | "heuristic";
  evaluator: { provider: string; ms: number } | null;
}

export interface SourcesDataPart {
  items: {
    key: string;
    type: "project" | "blog" | "experience" | "profile";
    title: string;
    path: string;
    cited: boolean;
    /** Confirmed by the System One attribution check. */
    verified: boolean;
  }[];
  attribution: { provider: string; ms: number } | null;
}

export type AssistantDataParts = {
  route: RouteDataPart;
  sources: SourcesDataPart;
};

export type AssistantUIMessage = UIMessage<
  AssistantMessageMetadata,
  AssistantDataParts,
  InferUITools<AssistantTools>
>;
