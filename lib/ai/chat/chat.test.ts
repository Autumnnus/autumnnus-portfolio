import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AssistantUIMessage } from "../agent/portfolio-agent";
import { mergeApprovalResponses } from "./approvals";
import {
  clientIp,
  createVisitorCookieValue,
  ipKeyFor,
  verifyVisitorCookie,
  visitorKeyFor,
} from "./identity";
import { parsePathname } from "./page-context";

describe("visitor cookie", () => {
  it("round-trips a signed id", () => {
    const value = createVisitorCookieValue();
    const id = verifyVisitorCookie(value);
    assert.ok(id);
    assert.equal(value.startsWith(id!), true);
  });

  it("rejects tampered or malformed cookies", () => {
    const value = createVisitorCookieValue();
    const [id, sig] = value.split(".");
    assert.equal(verifyVisitorCookie(`${id}x.${sig}`), null);
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    assert.equal(verifyVisitorCookie(`${id}.${flipped}`), null);
    assert.equal(verifyVisitorCookie("garbage"), null);
    assert.equal(verifyVisitorCookie(undefined), null);
  });

  it("derives stable, non-reversible keys", () => {
    assert.equal(visitorKeyFor("abc"), visitorKeyFor("abc"));
    assert.notEqual(visitorKeyFor("abc"), "abc");
    assert.notEqual(ipKeyFor("1.2.3.4"), ipKeyFor("1.2.3.5"));
  });
});

describe("clientIp", () => {
  it("takes the entry appended by the trusted proxy, not the spoofable left side", () => {
    const headers = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" });
    assert.equal(clientIp(headers), "203.0.113.9");
  });
  it("falls back to x-real-ip", () => {
    assert.equal(clientIp(new Headers({ "x-real-ip": "198.51.100.1" })), "198.51.100.1");
  });
});

describe("parsePathname", () => {
  it("understands localized routes", () => {
    assert.deepEqual(parsePathname("/tr/projects/autumnnus"), {
      type: "project",
      path: "/projects/autumnnus",
      slug: "autumnnus",
    });
    assert.deepEqual(parsePathname("/en/blog"), { type: "blog", path: "/blog" });
    assert.deepEqual(parsePathname("/tr"), { type: "home", path: "/" });
    assert.deepEqual(parsePathname("/en/work"), { type: "work", path: "/work" });
  });
  it("rejects unsafe input", () => {
    assert.equal(parsePathname("javascript:alert(1)"), null);
    assert.equal(parsePathname("/tr/<script>"), null);
    assert.equal(parsePathname(undefined), null);
  });
});

describe("mergeApprovalResponses", () => {
  const stored = {
    id: "msg_1",
    role: "assistant",
    parts: [
      {
        type: "tool-contactOwner",
        toolCallId: "call_1",
        state: "approval-requested",
        input: { replyTo: "a@b.co", topic: "job", message: "Hello there, let's talk" },
        approval: { id: "appr_1", signature: "server-sig" },
      },
    ],
  } as unknown as AssistantUIMessage;

  it("takes only the decision from the client and keeps the stored signature", () => {
    const merged = mergeApprovalResponses(stored, [
      {
        type: "tool-contactOwner",
        toolCallId: "call_1",
        state: "approval-responded",
        input: { replyTo: "attacker@evil.co", topic: "job", message: "changed" },
        approval: { id: "appr_1", approved: true, signature: "forged" },
      },
    ]);
    assert.ok(merged);
    const part = merged!.parts[0] as unknown as {
      state: string;
      input: { replyTo: string };
      approval: { approved: boolean; signature: string };
    };
    assert.equal(part.state, "approval-responded");
    assert.equal(part.approval.approved, true);
    assert.equal(part.approval.signature, "server-sig");
    assert.equal(part.input.replyTo, "a@b.co");
  });

  it("ignores responses for unknown approval ids", () => {
    const merged = mergeApprovalResponses(stored, [
      { toolCallId: "call_1", state: "approval-responded", approval: { id: "other", approved: true } },
    ]);
    assert.equal(merged, null);
  });
});
