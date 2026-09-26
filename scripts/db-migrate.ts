/**
 * Safe production migration runner.
 *
 *   yarn db:migrate:safe --dry-run     # inspect only, changes nothing
 *   yarn db:migrate:safe --yes         # apply (required for non-local hosts)
 *
 * What it does
 * 1. Connects to DATABASE_URL and reports the current state.
 * 2. Baselines databases that were created with `drizzle-kit push`
 *    (schema present, but no drizzle migration history): migrations
 *    0000–0002 are recorded as applied instead of being re-run.
 * 3. Applies pending migrations with drizzle's migrator (each in the
 *    migration transaction). 0003+ are idempotent.
 * 4. Verifies the result: legacy AI tables (incl. the old `Embedding`
 *    vector data) are gone, assistant tables exist, pgvector is enabled.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
/** Migrations that describe the pre-assistant schema (what `db:push` produced). */
const BASELINE_TAGS = ["0000_thin_hemingway", "0001_clean_the_captain", "0002_puzzling_chamber"];
const LEGACY_TABLES = [
  "Embedding",
  "AiApiKey",
  "AiChatSession",
  "AiChatMessage",
  "ChatRateLimit",
  "LiveChatConfig",
  "LiveChatGreeting",
  "LiveChatGreetingTranslation",
];
const REQUIRED_TABLES = [
  "KnowledgeDocument",
  "KnowledgeChunk",
  "AssistantThread",
  "AssistantMessage",
  "AssistantRateLimit",
  "AssistantSettings",
];

const dryRun = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--yes");

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

function journal(): JournalEntry[] {
  return JSON.parse(readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8")).entries;
}

function migrationHash(tag: string) {
  const sql = readFileSync(path.join(MIGRATIONS_DIR, `${tag}.sql`)).toString();
  return createHash("sha256").update(sql).digest("hex");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const { hostname, pathname } = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  console.log(`▶ Database: ${hostname}${pathname}${local ? " (local)" : ""}${dryRun ? " — DRY RUN" : ""}`);

  if (!local && !dryRun && !confirmed) {
    console.error("✖ Non-local database: re-run with --yes (after taking a backup), or --dry-run.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const q = async <T extends Record<string, unknown>>(text: string, params: unknown[] = []) =>
    (await pool.query<T>(text, params)).rows;

  try {
    const tables = new Set(
      (await q<{ t: string }>(`SELECT tablename AS t FROM pg_tables WHERE schemaname = 'public'`)).map((r) => r.t),
    );
    const vectorAvailable = (await q(`SELECT 1 FROM pg_available_extensions WHERE name = 'vector'`)).length > 0;
    const historyExists =
      (await q(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'`)).length > 0;
    const applied = historyExists
      ? await q<{ hash: string; created_at: string }>(`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`)
      : [];

    const entries = journal();
    const lastApplied = applied.length ? Number(applied[applied.length - 1].created_at) : 0;
    const legacyPresent = LEGACY_TABLES.filter((t) => tables.has(t));
    const embeddingRows = tables.has("Embedding")
      ? Number((await q<{ c: string }>(`SELECT count(*) AS c FROM "Embedding"`))[0].c)
      : 0;

    console.log(`  pgvector available: ${vectorAvailable ? "yes" : "NO"}`);
    console.log(`  migration history: ${historyExists ? `${applied.length} applied` : "none"}`);
    console.log(`  legacy AI tables: ${legacyPresent.length ? legacyPresent.join(", ") : "none"}`);
    if (embeddingRows) console.log(`  old vector rows in "Embedding": ${embeddingRows} (will be dropped)`);

    if (!vectorAvailable) {
      throw new Error("pgvector is not installed on this Postgres server. Use the pgvector/pgvector image or install the extension.");
    }

    // Baseline a push-managed database.
    const needsBaseline = applied.length === 0 && tables.has("Project");
    const pending = entries.filter((e) => e.when > lastApplied && !(needsBaseline && BASELINE_TAGS.includes(e.tag)));
    if (needsBaseline) console.log(`  ↳ schema exists without history → baseline ${BASELINE_TAGS.join(", ")}`);
    console.log(`  pending: ${pending.length ? pending.map((e) => e.tag).join(", ") : "nothing"}`);

    if (dryRun) {
      console.log("\n(dry run — nothing changed)");
      return;
    }

    if (needsBaseline) {
      await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
      await pool.query(
        `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`,
      );
      for (const entry of entries.filter((e) => BASELINE_TAGS.includes(e.tag))) {
        await pool.query(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [
          migrationHash(entry.tag),
          entry.when,
        ]);
      }
      console.log("✔ baseline recorded");
    }

    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    console.log("✔ migrations applied");

    // Verify.
    const after = new Set(
      (await q<{ t: string }>(`SELECT tablename AS t FROM pg_tables WHERE schemaname = 'public'`)).map((r) => r.t),
    );
    const stillLegacy = LEGACY_TABLES.filter((t) => after.has(t));
    const missing = REQUIRED_TABLES.filter((t) => !after.has(t));
    const vectorEnabled = (await q(`SELECT 1 FROM pg_extension WHERE extname = 'vector'`)).length > 0;
    if (stillLegacy.length || missing.length || !vectorEnabled) {
      throw new Error(
        `verification failed — legacy: [${stillLegacy.join(", ")}] missing: [${missing.join(", ")}] vector: ${vectorEnabled}`,
      );
    }
    console.log("✔ verified: legacy AI tables removed, assistant tables present, pgvector enabled");
    console.log("\nNext: open Admin › AI Assistant and click “Rebuild everything” (or run `yarn ai:reindex`).");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("✖", error instanceof Error ? error.message : error);
  process.exit(1);
});
