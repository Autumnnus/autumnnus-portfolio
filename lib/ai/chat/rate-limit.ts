import { db } from "@/lib/db";
import { assistantRateLimit } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Fixed-window counters in Postgres (no Redis needed at this scale).
 * One atomic upsert per key; the day window is UTC.
 */

export interface LimitRule {
  key: string;
  limit: number;
}

export interface LimitResult {
  ok: boolean;
  /** The first rule that was exceeded. */
  exceeded?: string;
  remaining: number;
  resetAt: Date;
}

export function dayWindow(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcMidnight(date = new Date()) {
  const next = new Date(date);
  next.setUTCHours(24, 0, 0, 0);
  return next;
}

export async function consumeRateLimits(
  rules: LimitRule[],
  window = dayWindow(),
): Promise<LimitResult> {
  let remaining = Number.POSITIVE_INFINITY;
  let exceeded: string | undefined;

  for (const rule of rules) {
    const [row] = await db
      .insert(assistantRateLimit)
      .values({ key: rule.key, window, count: 1 })
      .onConflictDoUpdate({
        target: [assistantRateLimit.key, assistantRateLimit.window],
        set: { count: sql`${assistantRateLimit.count} + 1` },
      })
      .returning({ count: assistantRateLimit.count });

    const left = rule.limit - row.count;
    remaining = Math.min(remaining, Math.max(0, left));
    if (left < 0 && !exceeded) exceeded = rule.key.split(":")[0];
  }

  return {
    ok: !exceeded,
    exceeded,
    remaining: Number.isFinite(remaining) ? remaining : 0,
    resetAt: nextUtcMidnight(),
  };
}

/** Read-only check (used for the contact tool before asking for approval). */
export async function peekCount(key: string, window = dayWindow()) {
  const row = await db.query.assistantRateLimit.findFirst({
    where: (t, { and, eq }) => and(eq(t.key, key), eq(t.window, window)),
  });
  return row?.count ?? 0;
}
