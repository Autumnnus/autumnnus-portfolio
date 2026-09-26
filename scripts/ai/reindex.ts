/**
 * Rebuilds / syncs the knowledge index from the content tables.
 *
 *   yarn ai:reindex            # incremental (hash diff)
 *   yarn ai:reindex --force    # re-embed everything
 *   yarn ai:reindex --type=project
 */
import "dotenv/config";
import { hasGeminiKey } from "../../lib/ai/gemini-keys";

async function main() {
  const { syncKnowledge } = await import("../../lib/ai/knowledge/indexer");
  const force = process.argv.includes("--force");
  const typeArg = process.argv.find((arg) => arg.startsWith("--type="))?.split("=")[1];
  const target =
    typeArg && ["project", "blog", "experience", "profile"].includes(typeArg)
      ? { sourceType: typeArg as "project" | "blog" | "experience" | "profile" }
      : ("all" as const);

  if (!hasGeminiKey()) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
    process.exit(1);
  }

  console.log(`▶ Syncing knowledge index (${typeof target === "string" ? target : target.sourceType}${force ? ", forced" : ""})…`);
  const report = await syncKnowledge(target, { force });
  console.log(
    `✔ ${report.indexed} indexed · ${report.unchanged} unchanged · ${report.removed} removed · ${report.chunks} chunks · ${report.ms} ms`,
  );
  for (const failure of report.failed) {
    console.error(`✖ ${failure.sourceType}:${failure.sourceId} [${failure.language}] ${failure.error}`);
  }
  process.exit(report.failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
