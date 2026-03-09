import { execSync } from "child_process";
import "dotenv/config";
import { Pool } from "pg";

const CONFIRM_ARG = "--confirm";

if (!process.argv.includes(CONFIRM_ARG)) {
  console.error(
    `⚠️  Bu script production DB'yi TAMAMEN SİLER ve sıfırdan kurar.`,
  );
  console.error(`   Devam etmek için: npx tsx scripts/prod-init.ts --confirm`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function dropAllTables() {
  console.log("🗑️  Tüm tablolar siliniyor...");

  await pool.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);

  console.log("🗑️  Tüm enum tipler siliniyor...");
  await pool.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT typname FROM pg_type
        WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
      ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
      END LOOP;
    END $$;
  `);

  // Drizzle migration tracking tablosunu da sıfırla
  await pool.query(`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`);

  console.log("✅ Veritabanı temizlendi.");
}

async function enableExtensions() {
  console.log("🔌 Eklentiler etkinleştiriliyor...");
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  console.log("✅ Eklentiler hazır.");
}

function runCommand(label: string, cmd: string) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { stdio: "inherit" });
}

async function main() {
  console.log("\n🚀 Production sıfır kurulum başlatılıyor...\n");

  try {
    await dropAllTables();
    await enableExtensions();
    await pool.end();

    // Migration'ları uygula (0000 ve 0001 dahil)
    runCommand("Migration uygulanıyor...", "npx drizzle-kit migrate");

    // Seed verisini yükle
    runCommand(
      "Seed verisi yükleniyor...",
      "ALLOW_PROD_SEED=true npx tsx lib/db/seed.ts",
    );

    console.log("\n✅ Production kurulumu başarıyla tamamlandı!");
    console.log(
      "   Artık 'Sync All Embeddings' ile embedding'leri oluşturabilirsin.",
    );
  } catch (error) {
    console.error("\n❌ Kurulum başarısız:", error);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
