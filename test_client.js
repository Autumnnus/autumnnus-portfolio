const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:postgres@127.0.0.1:5432/autumnnus_portfolio?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Prisma Client initialized");
  const skills = await prisma.skill.findMany();
  console.log("Skills:", skills);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
