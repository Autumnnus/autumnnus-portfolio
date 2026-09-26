import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readUIMessageStream, type ModelMessage } from "ai";
import { linkCitations, localizeHref, type ClientSource } from "@/components/assistant/lib";
import { AGENT_LIMITS } from "../config";
import type { RouteDecision } from "../system-one/gate";
import { runChatTurn } from "../chat/turn";
import { buildInstructions } from "./instructions";
import { preparePortfolioStep, type AssistantUIMessage } from "./portfolio-agent";
import { citeKey, citeKeyFromPath } from "./sources";

describe("loop policy (prepareStep)", () => {
  it("compacts history on the first step", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "hi" },
      {
        role: "assistant",
        content: [{ type: "tool-call", toolCallId: "1", toolName: "getProfile", input: {} }],
      },
      {
        role: "tool",
        content: [
          { type: "tool-result", toolCallId: "1", toolName: "getProfile", output: { type: "text", value: "x".repeat(5000) } },
        ],
      },
      { role: "assistant", content: "Answer" },
      { role: "user", content: "next" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "and?" },
    ];
    const result = preparePortfolioStep({ stepNumber: 0, messages });
    const serialized = JSON.stringify(result.messages);
    assert.ok(!serialized.includes("x".repeat(100)), "old tool payload should be pruned");
    assert.ok(serialized.includes("and?"));
  });

  it("forces an answer once the step budget is nearly spent", () => {
    assert.deepEqual(
      preparePortfolioStep({ stepNumber: AGENT_LIMITS.answerOnlyFromStep, messages: [] }),
      { activeTools: [] },
    );
    assert.deepEqual(preparePortfolioStep({ stepNumber: 2, messages: [] }), {});
  });
});

describe("instructions", () => {
  it("include page context and strict-mode hardening", () => {
    const text = buildInstructions({
      owner: { name: "Kadir Topçu", title: "Full-stack developer" },
      locale: "tr",
      page: { type: "project", path: "/projects/autumnnus", slug: "autumnnus", title: "Autumnnus" },
      mode: "strict",
      today: "2026-09-26",
    });
    assert.match(text, /Autumnnus/);
    assert.match(text, /Heightened caution/);
    assert.match(text, /Turkish/);
  });
});

describe("citations", () => {
  const known = new Map<string, ClientSource>([
    ["project:autumnnus", { key: "project:autumnnus", type: "project", title: "Autumnnus", path: "/projects/autumnnus" }],
    ["about", { key: "about", type: "profile", title: "Kadir", path: "/" }],
  ]);

  it("numbers known citations and drops unknown ones", () => {
    const { body, order } = linkCitations(
      "Built with Next.js [project:autumnnus]. Also [post:fake]. He is a dev [about] [project:autumnnus].",
      known,
    );
    assert.deepEqual(order, ["project:autumnnus", "about"]);
    assert.equal(
      body,
      "Built with Next.js [1](cite:project:autumnnus). Also. He is a dev [2](cite:about) [1](cite:project:autumnnus).",
    );
  });

  it("builds keys consistently on server and client", () => {
    assert.equal(citeKey("project", { slug: "a" }), "project:a");
    assert.equal(citeKeyFromPath("blog", "/blog/hello-world", "id"), "post:hello-world");
    assert.equal(citeKey("experience", { id: "1234567890abcdef" }), "work:12345678");
  });

  it("localizes internal links only", () => {
    assert.equal(localizeHref("/projects/a", "tr"), "/tr/projects/a");
    assert.equal(localizeHref("/tr/projects/a", "tr"), "/tr/projects/a");
    assert.equal(localizeHref("https://github.com", "tr"), "https://github.com");
    assert.equal(localizeHref("//evil.com", "tr"), "//evil.com");
  });
});

describe("runChatTurn (stream composition)", () => {
  it("streams route data + canned reply without calling a model", async () => {
    const route: RouteDecision = {
      tier: "fast",
      mode: "blocked",
      intent: "off_topic",
      signals: { intentConfidence: 0.99, injection: 0.1, abuse: 0.98, complexity: 0 },
      source: "evaluator",
      trace: { provider: "jev", ms: 87, ok: true },
    };
    let persisted: AssistantUIMessage | null = null;
    const stream = runChatTurn({
      messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "..." }] }],
      locale: "en",
      question: "...",
      page: null,
      route,
      models: { fast: "gemini-3.5-flash-lite", deep: "gemini-3.8-flash" },
      visitorKey: "v",
      threadId: "t".repeat(12),
      abortSignal: new AbortController().signal,
      cannedReply: "I can't help with that.",
      onComplete: async ({ responseMessage }) => {
        persisted = responseMessage;
      },
    });

    let last: AssistantUIMessage | undefined;
    for await (const message of readUIMessageStream<AssistantUIMessage>({ stream })) last = message;

    assert.ok(last);
    const routePart = last!.parts.find((p) => p.type === "data-route");
    assert.equal(routePart?.type === "data-route" && routePart.data.evaluator?.provider, "jev");
    const text = last!.parts.find((p) => p.type === "text");
    assert.equal(text?.type === "text" && text.text, "I can't help with that.");
    assert.equal(last!.metadata?.tier, "fast");
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(persisted, "onComplete should persist the response");
  });
});
