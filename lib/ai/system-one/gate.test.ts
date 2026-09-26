import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideRoute, heuristicRoute } from "./gate";

type Answers = Parameters<typeof decideRoute>[0];

function answers({
  intent = "portfolio",
  intentP = 0.95,
  injection = 0.02,
  abuse = 0.01,
  complexity = 0.3,
}: {
  intent?: "portfolio" | "tech" | "smalltalk" | "off_topic";
  intentP?: number;
  injection?: number;
  abuse?: number;
  complexity?: number;
} = {}): Answers {
  const others = (1 - intentP) / 3;
  const probabilities = { portfolio: others, tech: others, smalltalk: others, off_topic: others };
  probabilities[intent] = intentP;
  return {
    intent: { type: "choice", choice: intent, probabilities },
    injection: { type: "boolean", probability: injection },
    abuse: { type: "boolean", probability: abuse },
    complexity: { type: "score", score: complexity },
  } as Answers;
}

describe("decideRoute (System One gate)", () => {
  it("routes a simple portfolio question to the fast tier", () => {
    const route = decideRoute(answers());
    assert.equal(route.tier, "fast");
    assert.equal(route.mode, "normal");
    assert.equal(route.intent, "portfolio");
  });

  it("upgrades complex requests to the deep tier", () => {
    assert.equal(decideRoute(answers({ complexity: 1.6 })).tier, "deep");
  });

  it("blocks abuse before anything else", () => {
    const route = decideRoute(answers({ abuse: 0.97, injection: 0.95, complexity: 2 }));
    assert.equal(route.mode, "blocked");
    assert.equal(route.tier, "fast");
  });

  it("hardens the agent on suspected prompt injection but still answers", () => {
    assert.equal(decideRoute(answers({ injection: 0.9 })).mode, "strict");
  });

  it("only treats confident off-topic requests as no-tools", () => {
    assert.equal(decideRoute(answers({ intent: "off_topic", intentP: 0.92 })).mode, "no-tools");
    assert.equal(decideRoute(answers({ intent: "off_topic", intentP: 0.55 })).mode, "normal");
  });
});

describe("heuristicRoute (no evaluator)", () => {
  it("defaults to fast", () => {
    assert.equal(heuristicRoute("Hangi projelerde React var?").tier, "fast");
  });
  it("uses deep for comparisons / long questions", () => {
    assert.equal(heuristicRoute("Compare the architecture of project A and B").tier, "deep");
    assert.equal(heuristicRoute("x".repeat(260)).tier, "deep");
  });
});
