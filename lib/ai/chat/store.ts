import { db } from "@/lib/db";
import { assistantMessage, assistantThread } from "@/lib/db/schema";
import { and, asc, desc, eq, notInArray, sql } from "drizzle-orm";
import type { AssistantUIMessage } from "../agent/portfolio-agent";
import { CHAT_LIMITS, type AssistantLocale } from "../config";

/**
 * Conversation storage, designed to stay small:
 *
 * - UIMessages are stored as-is (parts JSON) so the widget can restore the
 *   exact rendering, but *compacted*: reasoning is dropped and every long
 *   string inside tool outputs is truncated (cards need titles, not bodies).
 * - A thread keeps at most `maxStoredMessagesPerThread` messages.
 * - Threads expire after the configured retention window (see settings.ts).
 * - Only an HMAC of the visitor id is stored; no IPs, no full prompts.
 */

const MAX_STRING = 600;
const MAX_ARRAY = 12;

function truncateDeep(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((item) => truncateDeep(item, depth + 1));
  }
  if (value && typeof value === "object" && depth < 8) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, truncateDeep(item, depth + 1)]),
    );
  }
  return value;
}

export function compactMessage(message: AssistantUIMessage): AssistantUIMessage {
  const parts = message.parts
    .filter((part) => part.type !== "reasoning")
    .map((part) => {
      if (part.type.startsWith("tool-") && "output" in part && part.output !== undefined) {
        return { ...part, output: truncateDeep(part.output) } as typeof part;
      }
      return part;
    });
  return { ...message, parts };
}

export interface LoadedThread {
  status: "new" | "owned" | "foreign";
  messages: AssistantUIMessage[];
}

export async function loadThread(threadId: string, visitorKey: string): Promise<LoadedThread> {
  const thread = await db.query.assistantThread.findFirst({
    where: eq(assistantThread.id, threadId),
    columns: { visitorId: true },
  });
  if (!thread) return { status: "new", messages: [] };
  if (thread.visitorId !== visitorKey) return { status: "foreign", messages: [] };

  const rows = await db
    .select()
    .from(assistantMessage)
    .where(eq(assistantMessage.threadId, threadId))
    .orderBy(asc(assistantMessage.createdAt));

  return {
    status: "owned",
    messages: rows.map(
      (row) =>
        ({
          id: row.id,
          role: row.role as AssistantUIMessage["role"],
          parts: row.parts as AssistantUIMessage["parts"],
          metadata: (row.metadata ?? undefined) as AssistantUIMessage["metadata"],
        }) satisfies AssistantUIMessage,
    ),
  };
}

export async function saveTurn({
  threadId,
  visitorKey,
  ipKey,
  locale,
  entryPath,
  title,
  messages,
  usage,
  flagged,
}: {
  threadId: string;
  visitorKey: string;
  ipKey: string;
  locale: AssistantLocale;
  entryPath: string | null;
  title: string;
  /** Messages created or changed in this turn (user message, response). */
  messages: AssistantUIMessage[];
  usage: { inputTokens: number; outputTokens: number };
  flagged: boolean;
}) {
  const now = new Date();

  await db.transaction(async (tx) => {
    const owned = await tx
      .insert(assistantThread)
      .values({
        id: threadId,
        visitorId: visitorKey,
        ipKey,
        language: locale,
        title,
        entryPath,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        flagged,
        lastMessageAt: now,
      })
      .onConflictDoUpdate({
        target: assistantThread.id,
        set: {
          lastMessageAt: now,
          ipKey,
          inputTokens: sql`${assistantThread.inputTokens} + ${usage.inputTokens}`,
          outputTokens: sql`${assistantThread.outputTokens} + ${usage.outputTokens}`,
          flagged: sql`${assistantThread.flagged} OR ${flagged}`,
        },
        // never let one visitor write into another visitor's thread
        setWhere: eq(assistantThread.visitorId, visitorKey),
      })
      .returning({ id: assistantThread.id });
    if (!owned.length) throw new Error("Thread belongs to another visitor.");

    for (const [index, message] of messages.entries()) {
      const compact = compactMessage(message);
      await tx
        .insert(assistantMessage)
        .values({
          id: compact.id,
          threadId,
          role: compact.role,
          parts: compact.parts,
          metadata: compact.metadata ?? null,
          // keep user → assistant order stable even within one millisecond
          createdAt: new Date(now.getTime() + index),
        })
        .onConflictDoUpdate({
          target: [assistantMessage.threadId, assistantMessage.id],
          set: { parts: compact.parts, metadata: compact.metadata ?? null },
        });
    }

    const keep = await tx
      .select({ id: assistantMessage.id })
      .from(assistantMessage)
      .where(eq(assistantMessage.threadId, threadId))
      .orderBy(desc(assistantMessage.createdAt))
      .limit(CHAT_LIMITS.maxStoredMessagesPerThread);

    await tx.delete(assistantMessage).where(
      and(
        eq(assistantMessage.threadId, threadId),
        notInArray(
          assistantMessage.id,
          keep.map((row) => row.id),
        ),
      ),
    );

    await tx
      .update(assistantThread)
      .set({
        messageCount: sql`(SELECT count(*) FROM ${assistantMessage} WHERE ${assistantMessage.threadId} = ${threadId})`,
      })
      .where(eq(assistantThread.id, threadId));
  });
}

export async function deleteThread(threadId: string, visitorKey: string) {
  await db
    .delete(assistantThread)
    .where(and(eq(assistantThread.id, threadId), eq(assistantThread.visitorId, visitorKey)));
}
