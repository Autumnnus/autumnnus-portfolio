import { db } from "@/lib/db";
import { assistantMessage, assistantThread } from "@/lib/db/schema";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { AssistantUIMessage } from "../agent/portfolio-agent";

/**
 * Admin read models: conversations grouped per person.
 *
 * "Person" is either the signed visitor cookie (one browser) or the hashed
 * IP (one network — groups a visitor across browsers / cleared cookies).
 * Both are keyed hashes; raw IPs are never stored.
 */

export type VisitorGrouping = "visitor" | "ip";

export interface VisitorSummary {
  key: string;
  threads: number;
  messages: number;
  tokens: number;
  firstSeen: Date;
  lastSeen: Date;
  flagged: boolean;
  languages: string[];
  lastTitle: string;
  /** For visitor grouping: distinct networks; for IP grouping: distinct browsers. */
  linked: number;
  /** Threads the visitor deleted from the widget (still kept here). */
  deleted: number;
}

export function shortKey(key: string) {
  return key.slice(0, 6).toUpperCase();
}

export async function listVisitors(by: VisitorGrouping, limit = 200): Promise<VisitorSummary[]> {
  const column = by === "ip" ? assistantThread.ipKey : assistantThread.visitorId;
  const other = by === "ip" ? assistantThread.visitorId : assistantThread.ipKey;

  const rows = await db
    .select({
      key: column,
      threads: sql<number>`count(*)::int`,
      messages: sql<number>`coalesce(sum(${assistantThread.messageCount}), 0)::int`,
      tokens: sql<number>`coalesce(sum(${assistantThread.inputTokens} + ${assistantThread.outputTokens}), 0)::int`,
      firstSeen: sql<Date>`min(${assistantThread.createdAt})`,
      lastSeen: sql<Date>`max(${assistantThread.lastMessageAt})`,
      flagged: sql<boolean>`bool_or(${assistantThread.flagged})`,
      languages: sql<string[]>`array_agg(distinct ${assistantThread.language}::text)`,
      lastTitle: sql<string>`(array_agg(${assistantThread.title} order by ${assistantThread.lastMessageAt} desc))[1]`,
      linked: sql<number>`count(distinct ${other})::int`,
      deleted: sql<number>`count(${assistantThread.deletedAt})::int`,
    })
    .from(assistantThread)
    .where(sql`${column} is not null`)
    .groupBy(column)
    .orderBy(desc(sql`max(${assistantThread.lastMessageAt})`))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    key: row.key as string,
    firstSeen: new Date(row.firstSeen),
    lastSeen: new Date(row.lastSeen),
  }));
}

export interface VisitorThread {
  id: string;
  title: string;
  language: string;
  entryPath: string | null;
  createdAt: Date;
  lastMessageAt: Date;
  flagged: boolean;
  tokens: number;
  visitorId: string;
  ipKey: string | null;
  deletedAt: Date | null;
  messages: AssistantUIMessage[];
}

/** Every conversation of one person, newest first, with full transcripts. */
export async function getVisitorThreads(by: VisitorGrouping, key: string): Promise<VisitorThread[]> {
  const column = by === "ip" ? assistantThread.ipKey : assistantThread.visitorId;
  const threads = await db
    .select()
    .from(assistantThread)
    .where(eq(column, key))
    .orderBy(desc(assistantThread.lastMessageAt))
    .limit(100);
  if (!threads.length) return [];

  const rows = await db
    .select()
    .from(assistantMessage)
    .where(inArray(assistantMessage.threadId, threads.map((t) => t.id)))
    .orderBy(asc(assistantMessage.createdAt));

  const byThread = new Map<string, AssistantUIMessage[]>();
  for (const row of rows) {
    const list = byThread.get(row.threadId) ?? [];
    list.push({
      id: row.id,
      role: row.role as AssistantUIMessage["role"],
      parts: row.parts as AssistantUIMessage["parts"],
      metadata: (row.metadata ?? undefined) as AssistantUIMessage["metadata"],
    });
    byThread.set(row.threadId, list);
  }

  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    language: thread.language,
    entryPath: thread.entryPath,
    createdAt: thread.createdAt,
    lastMessageAt: thread.lastMessageAt,
    flagged: thread.flagged,
    tokens: thread.inputTokens + thread.outputTokens,
    visitorId: thread.visitorId,
    ipKey: thread.ipKey,
    deletedAt: thread.deletedAt,
    messages: byThread.get(thread.id) ?? [],
  }));
}

export async function deleteVisitor(by: VisitorGrouping, key: string) {
  const column = by === "ip" ? assistantThread.ipKey : assistantThread.visitorId;
  await db.delete(assistantThread).where(eq(column, key));
}
