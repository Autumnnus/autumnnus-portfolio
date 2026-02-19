import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if the global instance has the latest models (like uniqueVisitor)
const shouldCreateNew =
  !globalForPrisma.prisma ||
  !(globalForPrisma.prisma as unknown as Record<string, unknown>).uniqueVisitor;

export const prisma = shouldCreateNew
  ? new PrismaClient({ adapter })
  : globalForPrisma.prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
