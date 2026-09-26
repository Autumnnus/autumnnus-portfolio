import { db } from "@/lib/db";
import {
  assistantRateLimit,
  assistantSettings,
  assistantThread,
  type AssistantSettings,
} from "@/lib/db/schema";
import { and, isNull, lt, or, sql } from "drizzle-orm";

/**
 * Single-row settings table + lazy retention.
 *
 * There is no cron in this deployment, so maintenance is opportunistic: at
 * most once a day, the first chat request after the window claims the run
 * with a conditional UPDATE (safe with concurrent requests) and prunes
 * expired threads and old rate-limit windows in the background.
 */

const CACHE_MS = 30_000;
let cache: { value: AssistantSettings; at: number } | null = null;

export async function getAssistantSettings(): Promise<AssistantSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  let row = await db.query.assistantSettings.findFirst();
  if (!row) {
    [row] = await db
      .insert(assistantSettings)
      .values({ id: 1 })
      .onConflictDoNothing()
      .returning();
    row ??= await db.query.assistantSettings.findFirst();
  }
  cache = { value: row!, at: Date.now() };
  return row!;
}

export type EditableAssistantSettings = Pick<
  AssistantSettings,
  | "enabled"
  | "modelFast"
  | "modelDeep"
  | "visitorDailyLimit"
  | "globalDailyLimit"
  | "retentionDays"
>;

export async function updateAssistantSettings(values: EditableAssistantSettings) {
  await getAssistantSettings();
  const [row] = await db
    .update(assistantSettings)
    .set(values)
    .where(sql`${assistantSettings.id} = 1`)
    .returning();
  cache = { value: row, at: Date.now() };
  return row;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runMaintenanceIfDue(): Promise<void> {
  const settings = await getAssistantSettings();
  const threshold = new Date(Date.now() - DAY_MS);

  const claimed = await db
    .update(assistantSettings)
    .set({ lastMaintenanceAt: new Date() })
    .where(
      and(
        sql`${assistantSettings.id} = 1`,
        or(
          isNull(assistantSettings.lastMaintenanceAt),
          lt(assistantSettings.lastMaintenanceAt, threshold),
        ),
      ),
    )
    .returning({ id: assistantSettings.id });
  if (!claimed.length) return;

  const expiry = new Date(Date.now() - settings.retentionDays * DAY_MS);
  const oldestWindow = new Date(Date.now() - 3 * DAY_MS).toISOString().slice(0, 10);

  const [threads, windows] = await Promise.all([
    db
      .delete(assistantThread)
      .where(lt(assistantThread.lastMessageAt, expiry))
      .returning({ id: assistantThread.id }),
    db
      .delete(assistantRateLimit)
      .where(lt(assistantRateLimit.window, oldestWindow))
      .returning({ key: assistantRateLimit.key }),
  ]);

  cache = null;
  if (threads.length || windows.length) {
    console.info(
      `[assistant] maintenance: removed ${threads.length} expired thread(s), ${windows.length} rate-limit window(s)`,
    );
  }
}
