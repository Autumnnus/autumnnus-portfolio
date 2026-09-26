import { isToolUIPart } from "ai";
import type { AssistantUIMessage } from "../agent/portfolio-agent";

export type IncomingParts = Record<string, unknown>[];

/**
 * Applies the visitor's approval decision to the *stored* assistant message.
 * Only `approved`/`reason` are taken from the client; the approval id and
 * HMAC signature come from our own storage, so a forged part cannot sneak in
 * a different tool input.
 */
export function mergeApprovalResponses(
  stored: AssistantUIMessage,
  incomingParts: IncomingParts,
): AssistantUIMessage | null {
  let changed = false;
  const parts = stored.parts.map((part) => {
    if (!isToolUIPart(part) || part.state !== "approval-requested") return part;
    const response = incomingParts.find(
      (p) =>
        p.toolCallId === part.toolCallId &&
        p.state === "approval-responded" &&
        (p.approval as { id?: string } | undefined)?.id === part.approval.id,
    );
    const approved = (response?.approval as { approved?: unknown } | undefined)?.approved;
    if (typeof approved !== "boolean") return part;
    changed = true;
    return {
      ...part,
      state: "approval-responded" as const,
      approval: { ...part.approval, approved },
    };
  });
  return changed ? ({ ...stored, parts } as AssistantUIMessage) : null;
}
