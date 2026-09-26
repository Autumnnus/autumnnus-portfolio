import { after } from "next/server";
import type { SyncTarget } from "./documents";
import { describeTarget, syncKnowledge } from "./indexer";
import { hasGeminiKey } from "../gemini-keys";

/**
 * Keeps the knowledge index fresh without slowing down admin saves.
 *
 * Save actions call `scheduleKnowledgeSync(...)`; the work runs after the
 * response is sent (`after()`), through a single in-process queue so bursts
 * of edits are serialised and duplicate targets are coalesced. The indexer is
 * hash-based, so over-scheduling only costs a few cheap reads.
 */

let queue: Promise<void> = Promise.resolve();
const pending = new Set<string>();

function enqueue(target: SyncTarget): Promise<void> {
  const key = describeTarget(target);
  if (pending.has(key) || pending.has("all")) return queue;
  pending.add(key);

  queue = queue.then(async () => {
    pending.delete(key);
    try {
      const report = await syncKnowledge(target);
      if (report.failed.length) {
        console.error(`[knowledge] sync ${key}: ${report.failed.length} failure(s)`, report.failed);
      }
    } catch (error) {
      console.error(`[knowledge] sync ${key} crashed:`, error);
    }
  });
  return queue;
}

export function scheduleKnowledgeSync(target: SyncTarget) {
  if (!hasGeminiKey()) return;
  try {
    after(() => enqueue(target));
  } catch {
    // Outside a request scope (scripts, tests): run in the background.
    void enqueue(target);
  }
}

/** For the admin "reindex" button: waits for the queue, returns the report. */
export async function runKnowledgeSyncNow(target: SyncTarget, force = false) {
  await queue;
  return syncKnowledge(target, { force });
}
