/**
 * Retrieval eval / ablation harness.
 *
 * Runs every question of a golden set through four pipeline configurations
 * and reports Recall@5, MRR and nDCG@10 (binary relevance, per source):
 *
 *   lexical        Postgres FTS only
 *   vector         pgvector only
 *   hybrid         RRF(lexical, vector)
 *   hybrid+judge   RRF(hybrid, System One relevance judge)   ← production
 *
 *   yarn ai:eval                          # evals/retrieval.golden.json
 *   yarn ai:eval --file=evals/my.json --out=evals/results.json
 *
 * Judge-circularity note: labels in the golden set must come from a human
 * (or a different model family than the judge), otherwise the judge grades
 * its own homework and the "+judge" row is inflated.
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";

interface GoldenItem {
  id: string;
  question: string;
  locale: "tr" | "en";
  /** Citation keys of relevant sources, e.g. "project:autumnnus-portfolio". */
  relevant: string[];
}

type Config = {
  name: string;
  retrievers: ("lexical" | "vector")[];
  judge: boolean;
};

const CONFIGS: Config[] = [
  { name: "lexical", retrievers: ["lexical"], judge: false },
  { name: "vector", retrievers: ["vector"], judge: false },
  { name: "hybrid", retrievers: ["lexical", "vector"], judge: false },
  { name: "hybrid+judge", retrievers: ["lexical", "vector"], judge: true },
];

function dcg(relevances: number[]) {
  return relevances.reduce((sum, rel, i) => sum + rel / Math.log2(i + 2), 0);
}

function metrics(ranked: string[], relevant: Set<string>) {
  const top5 = ranked.slice(0, 5);
  const recall5 = relevant.size ? top5.filter((k) => relevant.has(k)).length / relevant.size : 0;
  const firstHit = ranked.findIndex((k) => relevant.has(k));
  const mrr = firstHit === -1 ? 0 : 1 / (firstHit + 1);
  const gains = ranked.slice(0, 10).map((k) => (relevant.has(k) ? 1 : 0));
  const ideal = Array.from({ length: Math.min(relevant.size, 10) }, () => 1);
  const ndcg = ideal.length ? dcg(gains) / dcg(ideal) : 0;
  return { recall5, mrr, ndcg };
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const p50 = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

async function main() {
  const { searchKnowledge } = await import("../../lib/ai/knowledge/search");
  const { citeKeyFromPath } = await import("../../lib/ai/agent/sources");
  const { getAiProviderStatus } = await import("../../lib/ai/providers");
  const { db } = await import("../../lib/db");
  const { knowledgeDocument } = await import("../../lib/db/schema");

  const file = process.argv.find((a) => a.startsWith("--file="))?.split("=")[1] ?? "evals/retrieval.golden.json";
  const out = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1];
  const golden = JSON.parse(readFileSync(file, "utf8")) as GoldenItem[];

  // Only evaluate questions whose ground truth exists in the current index.
  const docs = await db
    .select({ sourceType: knowledgeDocument.sourceType, sourceId: knowledgeDocument.sourceId, path: knowledgeDocument.path })
    .from(knowledgeDocument);
  const indexedKeys = new Set(docs.map((d) => citeKeyFromPath(d.sourceType, d.path, d.sourceId)));
  const items = golden.filter((item) => item.relevant.some((key) => indexedKeys.has(key)));
  const skipped = golden.length - items.length;

  const status = getAiProviderStatus();
  const configs = CONFIGS.filter((c) => !c.judge || status.evaluator === "jev");
  console.log(
    `Evaluating ${items.length} questions (${skipped} skipped: ground truth not indexed) · evaluator: ${status.evaluator}\n`,
  );

  const rows: Record<string, unknown>[] = [];
  for (const config of configs) {
    const scores: { recall5: number; mrr: number; ndcg: number }[] = [];
    const latencies: number[] = [];
    for (const item of items) {
      const { hits, trace } = await searchKnowledge({
        query: item.question,
        question: item.question,
        locale: item.locale,
        retrievers: config.retrievers,
        judge: config.judge,
        limit: 10,
      });
      const ranked: string[] = [];
      for (const hit of hits) {
        const key = citeKeyFromPath(hit.sourceType, hit.path, hit.sourceId);
        if (!ranked.includes(key)) ranked.push(key);
      }
      scores.push(metrics(ranked, new Set(item.relevant)));
      latencies.push(trace.ms.total);
    }
    rows.push({
      config: config.name,
      "Recall@5": mean(scores.map((s) => s.recall5)).toFixed(3),
      MRR: mean(scores.map((s) => s.mrr)).toFixed(3),
      "nDCG@10": mean(scores.map((s) => s.ndcg)).toFixed(3),
      "p50 ms": p50(latencies),
    });
  }

  const headers = Object.keys(rows[0] ?? {});
  console.log(`| ${headers.join(" | ")} |`);
  console.log(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) console.log(`| ${headers.map((h) => row[h]).join(" | ")} |`);
  if (status.evaluator !== "jev") {
    console.log("\n(hybrid+judge skipped: set TYPESAFE_AI_API_KEY or AI_GATEWAY_API_KEY to enable Jev)");
  }

  if (out) {
    writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), evaluator: status.evaluator, rows }, null, 2));
    console.log(`\nSaved → ${out}`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
