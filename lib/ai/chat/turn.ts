import {
  createAgentUIStream,
  createIdGenerator,
  createUIMessageStream,
  isToolUIPart,
  type InferUIMessageChunk,
  type LanguageModelUsage,
} from "ai";
import {
  portfolioAgent,
  type AssistantUIMessage,
  type RouteDataPart,
  type SourcesDataPart,
} from "../agent/portfolio-agent";
import { INSTRUCTIONS_VERSION } from "../agent/instructions";
import { CITATION_PATTERN, type SourceRef } from "../agent/sources";
import { AGENT_LIMITS, type AssistantLocale } from "../config";
import { attributeSources } from "../system-one/attribution";
import type { RouteDecision } from "../system-one/gate";
import type { PageContext } from "./page-context";

/**
 * One chat turn, as a composed UI message stream:
 *
 *   start (metadata) → data-route (System One decision)
 *     → agent stream (text, tool calls, preliminary tool results, approvals)
 *     → data-sources (cited, then verified by attribution; reconciled by id)
 *     → finish (usage + latency metadata)
 */

const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });

export interface TurnInput {
  messages: AssistantUIMessage[];
  locale: AssistantLocale;
  question: string;
  page: PageContext | null;
  route: RouteDecision;
  /** Gemini model id per tier, from admin settings. */
  models: { fast: string; deep: string };
  visitorKey: string;
  threadId: string;
  abortSignal: AbortSignal;
  cannedReply?: string;
  onComplete: (result: {
    responseMessage: AssistantUIMessage;
    isContinuation: boolean;
    usage: { inputTokens: number; outputTokens: number };
  }) => Promise<void>;
}

type ToolRecord = { toolName: string; output: unknown };

/** Collects every entity the turn's tools returned, keyed by citation key. */
function sourcesFromTools(records: ToolRecord[]) {
  const registry = new Map<string, SourceRef & { content?: string }>();
  const add = (ref: SourceRef & { content?: string }) => {
    if (!registry.has(ref.key)) registry.set(ref.key, ref);
  };

  for (const { toolName, output } of records) {
    const o = output as Record<string, unknown> | null;
    if (!o) continue;
    switch (toolName) {
      case "searchKnowledge":
        for (const r of (o.results as Record<string, string>[] | undefined) ?? []) {
          add({ key: r.cite, type: r.type as SourceRef["type"], title: r.title, path: r.path, content: r.snippet });
        }
        break;
      case "listProjects":
        for (const p of (o.projects as Record<string, string>[] | undefined) ?? []) {
          add({ key: p.cite, type: "project", title: p.title, path: p.path, content: p.summary });
        }
        break;
      case "getProject": {
        const p = o.project as Record<string, string> | undefined;
        if (p) add({ key: p.cite, type: "project", title: p.title, path: p.path, content: p.description });
        break;
      }
      case "listPosts":
        for (const p of (o.posts as Record<string, string>[] | undefined) ?? []) {
          add({ key: p.cite, type: "blog", title: p.title, path: p.path, content: p.description });
        }
        break;
      case "getPost": {
        const p = o.post as Record<string, string> | undefined;
        if (p) add({ key: p.cite, type: "blog", title: p.title, path: p.path, content: p.content });
        break;
      }
      case "getCareer":
        for (const p of (o.positions as Record<string, string>[] | undefined) ?? []) {
          add({ key: p.cite, type: "experience", title: `${p.role} · ${p.company}`, path: "/work", content: p.description });
        }
        break;
      case "getProfile": {
        const p = o.profile as Record<string, string> | undefined;
        if (p) add({ key: "about", type: "profile", title: p.name, path: "/", content: p.about || p.intro });
        break;
      }
    }
  }
  return registry;
}

function citedKeys(text: string) {
  const keys: string[] = [];
  for (const match of text.matchAll(CITATION_PATTERN)) {
    const key = match[1].toLowerCase();
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

export function runChatTurn(input: TurnInput) {
  const startedAt = performance.now();
  const modelId = input.models[input.route.tier];
  const usage = { inputTokens: 0, outputTokens: 0 };

  const routePart: RouteDataPart = {
    tier: input.route.tier,
    model: modelId,
    mode: input.route.mode,
    intent: input.route.intent,
    source: input.route.source,
    evaluator:
      input.route.trace.provider === "off"
        ? null
        : { provider: input.route.trace.provider, ms: input.route.trace.ms },
  };

  return createUIMessageStream<AssistantUIMessage>({
    originalMessages: input.messages,
    generateId: generateMessageId,
    onError: (error) => {
      console.error("[assistant] stream error:", error);
      return "stream_error";
    },
    onEnd: async ({ responseMessage, isContinuation }) => {
      try {
        await input.onComplete({ responseMessage, isContinuation, usage });
      } catch (error) {
        console.error("[assistant] failed to persist turn:", error);
      }
    },
    execute: async ({ writer }) => {
      writer.write({
        type: "start",
        messageMetadata: {
          createdAt: Date.now(),
          model: modelId,
          tier: input.route.tier,
          instructionsVersion: INSTRUCTIONS_VERSION,
        },
      });
      writer.write({ type: "data-route", id: "route", data: routePart });

      // ── canned reply (gate blocked the request, no LLM call) ──────────────
      if (input.cannedReply) {
        writer.write({ type: "text-start", id: "canned" });
        writer.write({ type: "text-delta", id: "canned", delta: input.cannedReply });
        writer.write({ type: "text-end", id: "canned" });
        writer.write({
          type: "finish",
          finishReason: "stop",
          messageMetadata: { latencyMs: Math.round(performance.now() - startedAt), steps: 0 },
        });
        return;
      }

      // ── agent loop ────────────────────────────────────────────────────────
      const toolNames = new Map<string, string>();
      const toolOutputs = new Map<string, unknown>();
      let text = "";
      let steps = 0;

      const agentStream = await createAgentUIStream({
        agent: portfolioAgent,
        uiMessages: input.messages,
        options: {
          locale: input.locale,
          tier: input.route.tier,
          modelId,
          mode: input.route.mode,
          question: input.question,
          page: input.page,
          visitorKey: input.visitorKey,
          threadId: input.threadId,
        },
        abortSignal: input.abortSignal,
        timeout: {
          totalMs: AGENT_LIMITS.totalTimeoutMs,
          stepMs: AGENT_LIMITS.stepTimeoutMs,
          toolMs: AGENT_LIMITS.toolTimeoutMs,
        },
        sendStart: false,
        sendFinish: false,
        sendReasoning: false,
        onStepEnd: ({ usage: stepUsage }: { usage: LanguageModelUsage }) => {
          steps++;
          usage.inputTokens += stepUsage.inputTokens ?? 0;
          usage.outputTokens += stepUsage.outputTokens ?? 0;
        },
      });

      for await (const chunk of agentStream) {
        switch (chunk.type) {
          case "text-delta":
            text += chunk.delta;
            break;
          case "tool-input-available":
            toolNames.set(chunk.toolCallId, chunk.toolName);
            break;
          case "tool-output-available":
            toolOutputs.set(chunk.toolCallId, chunk.output);
            break;
        }
        // The agent itself never emits data parts, so its chunks are a subset.
        writer.write(chunk as InferUIMessageChunk<AssistantUIMessage>);
      }

      // Tool outputs from an approval continuation live in the history.
      const last = input.messages.at(-1);
      if (last?.role === "assistant") {
        for (const part of last.parts) {
          if (isToolUIPart(part) && part.state === "output-available") {
            toolNames.set(part.toolCallId, part.type.slice("tool-".length));
            toolOutputs.set(part.toolCallId, part.output);
          }
        }
      }

      // ── sources: cited → verified ─────────────────────────────────────────
      const registry = sourcesFromTools(
        [...toolOutputs.entries()].map(([id, output]) => ({
          toolName: toolNames.get(id) ?? "",
          output,
        })),
      );
      const cited = citedKeys(text).filter((key) => registry.has(key));

      if (registry.size) {
        const items = (verified: Set<string> | null): SourcesDataPart["items"] => {
          const keys = [
            ...cited,
            ...[...registry.keys()].filter((key) => !cited.includes(key) && verified?.has(key)),
          ];
          return keys.map((key) => {
            const ref = registry.get(key)!;
            return {
              key,
              type: ref.type,
              title: ref.title,
              path: ref.path,
              cited: cited.includes(key),
              verified: verified?.has(key) ?? false,
            };
          });
        };

        if (cited.length) {
          writer.write({
            type: "data-sources",
            id: "sources",
            data: { items: items(null), attribution: null },
          });
        }

        const candidates = [...registry.values()]
          .filter((ref) => ref.content)
          .slice(0, 8)
          .map((ref) => ({ ref: ref.key, title: ref.title, content: ref.content! }));

        const { used, trace } = await attributeSources({
          answer: text,
          candidates,
          abortSignal: input.abortSignal,
        });

        if (used) {
          writer.write({
            type: "data-sources",
            id: "sources",
            data: {
              items: items(used),
              attribution: trace ? { provider: trace.provider, ms: trace.ms } : null,
            },
          });
        }
      }

      writer.write({
        type: "finish",
        finishReason: "stop",
        messageMetadata: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs: Math.round(performance.now() - startedAt),
          steps,
        },
      });
    },
  });
}
