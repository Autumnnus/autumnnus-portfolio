"use server";

import { PrismaPg } from "@prisma/adapter-pg";
import { Language, PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function getProjects(lang: Language) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        translations: {
          where: { language: lang },
        },
        technologies: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return projects.map((p) => {
      const translation = p.translations[0] || {};
      return {
        ...p,
        title: translation.title || p.slug, // Fallback
        shortDescription: translation.shortDescription || "",
        fullDescription: translation.fullDescription || "",
      };
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export async function getSkills() {
  try {
    return await prisma.skill.findMany();
  } catch (error) {
    console.error("Failed to fetch skills", error);
    return [];
  }
}
