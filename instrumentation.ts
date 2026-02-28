export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("./lib/db");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { profile } = await import("./lib/db/schema");
    const path = await import("path");

    try {
      await migrate(db, {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      });
      console.log("✅ Migrations applied");

      if (process.env.DB_SEED === "true") {
        const profiles = await db.select().from(profile).limit(1);
        if (profiles.length === 0) {
          console.log("📭 Running manual seed...");
          const { seedDatabase } = await import("./lib/db/seed");
          await seedDatabase(db);
          console.log("✅ Seed completed");
        }
      }
    } catch (error) {
      console.error("❌ DB initialization failed:", error);
    }
  }
}
