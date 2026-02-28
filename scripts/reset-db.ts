import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reset() {
  try {
    console.log("Vector eklentisi yeniden kuruluyor...");
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("✅ Vector eklentisi eklendi!");
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await pool.end();
  }
}

reset();
