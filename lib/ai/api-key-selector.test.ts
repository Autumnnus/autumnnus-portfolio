import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextPacificMidnight,
  isGeminiTemporaryUnavailable,
  resolveGeminiRateLimit,
} from "@/lib/ai/gemini-rate-limit";
import {
  selectAvailableApiKey,
  sortSelectableApiKeys,
  type SelectableApiKey,
} from "@/lib/ai/api-key-selector";

function createKey(
  id: string,
  category: "free" | "paid",
  priority: number,
  quotaGroup: string,
): SelectableApiKey {
  return {
    id,
    category,
    priority,
    quotaGroup,
    createdAt: new Date(`2026-01-0${priority + 1}T00:00:00.000Z`),
  };
}

test("sorts free keys before paid keys and by priority", () => {
  const result = sortSelectableApiKeys([
    createKey("paid-1", "paid", 0, "paid-group"),
    createKey("free-2", "free", 2, "free-2"),
    createKey("free-1", "free", 1, "free-1"),
  ]);

  assert.deepEqual(
    result.map((key) => key.id),
    ["free-1", "free-2", "paid-1"],
  );
});

test("falls back to next free key when first free quota group is blocked", () => {
  const result = selectAvailableApiKey(
    [
      createKey("free-1", "free", 0, "group-a"),
      createKey("free-2", "free", 1, "group-b"),
      createKey("paid-1", "paid", 0, "group-c"),
    ],
    {
      blockedUntilByQuotaGroup: new Map([
        ["group-a", new Date("2026-03-11T10:05:00.000Z")],
      ]),
      now: new Date("2026-03-11T10:00:00.000Z"),
    },
  );

  assert.equal(result.key?.id, "free-2");
});

test("falls back to paid when all free keys are blocked", () => {
  const result = selectAvailableApiKey(
    [
      createKey("free-1", "free", 0, "group-a"),
      createKey("free-2", "free", 1, "group-b"),
      createKey("paid-1", "paid", 0, "group-c"),
    ],
    {
      blockedUntilByQuotaGroup: new Map([
        ["group-a", new Date("2026-03-11T10:05:00.000Z")],
        ["group-b", new Date("2026-03-11T10:04:00.000Z")],
      ]),
      now: new Date("2026-03-11T10:00:00.000Z"),
    },
  );

  assert.equal(result.key?.id, "paid-1");
});

test("blocks all keys in the same quota group together", () => {
  const result = selectAvailableApiKey(
    [
      createKey("free-1", "free", 0, "shared-group"),
      createKey("free-2", "free", 1, "shared-group"),
      createKey("paid-1", "paid", 0, "group-c"),
    ],
    {
      blockedUntilByQuotaGroup: new Map([
        ["shared-group", new Date("2026-03-11T10:05:00.000Z")],
      ]),
      now: new Date("2026-03-11T10:00:00.000Z"),
    },
  );

  assert.equal(result.key?.id, "paid-1");
});

test("returns the earliest next available time when every key is blocked", () => {
  const result = selectAvailableApiKey(
    [
      createKey("free-1", "free", 0, "group-a"),
      createKey("paid-1", "paid", 0, "group-b"),
    ],
    {
      blockedUntilByQuotaGroup: new Map([
        ["group-a", new Date("2026-03-11T10:05:00.000Z")],
        ["group-b", new Date("2026-03-11T10:02:00.000Z")],
      ]),
      now: new Date("2026-03-11T10:00:00.000Z"),
    },
  );

  assert.equal(result.key, null);
  assert.equal(result.nextAvailableAt?.toISOString(), "2026-03-11T10:02:00.000Z");
});

test("classifies minute quota errors from retry info", () => {
  const result = resolveGeminiRateLimit(
    {
      status: 429,
      message: "Quota exceeded",
      errorDetails: [
        {
          "@type": "type.googleapis.com/google.rpc.RetryInfo",
          retryDelay: "45s",
        },
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [{ description: "Requests per minute exceeded" }],
        },
      ],
    },
    new Date("2026-03-11T10:00:00.000Z"),
  );

  assert.equal(result?.blockReason, "rpm");
  assert.equal(result?.retryAfterSeconds, 45);
  assert.equal(result?.blockedUntil.toISOString(), "2026-03-11T10:00:45.000Z");
});

test("classifies daily quota errors to next Pacific midnight", () => {
  const now = new Date("2026-03-11T18:00:00.000Z");
  const result = resolveGeminiRateLimit(
    {
      status: 429,
      message: "Requests per day exceeded",
      errorDetails: [
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [{ description: "Requests per day exceeded" }],
        },
      ],
    },
    now,
  );

  assert.equal(result?.blockReason, "rpd");
  assert.equal(result?.blockedUntil.toISOString(), getNextPacificMidnight(now).toISOString());
});

test("returns null for non-rate-limit errors", () => {
  const result = resolveGeminiRateLimit({
    status: 500,
    message: "Internal error",
  });

  assert.equal(result, null);
});

test("treats 503 high-demand errors as temporary availability issues, not quota blocks", () => {
  const error = {
    status: 503,
    message: "This model is currently experiencing high demand. Please try again later.",
    errorDetails: [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        reason: "RESOURCE_EXHAUSTED",
      },
    ],
  };

  assert.equal(isGeminiTemporaryUnavailable(error), true);
  assert.equal(resolveGeminiRateLimit(error), null);
});
