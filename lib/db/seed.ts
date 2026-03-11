/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { pathToFileURL } from "node:url";
import { db } from "./index";
import type * as schema from "./schema";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
  category,
  profile,
  profileTranslation,
  project,
  projectTranslation,
  quest,
  questTranslation,
  skill,
  socialLink,
  workExperience,
  workExperienceTranslation,
} from "./schema";
import { formatDate } from "../utils";

export async function seedDatabase(
  database: NodePgDatabase<typeof schema> = db,
) {
  const isProduction = process.env.NODE_ENV === "production";
  const allowProductionSeed = process.env.ALLOW_PROD_SEED === "true";

  if (isProduction && !allowProductionSeed) {
    throw new Error(
      "Seeding is blocked in production. Set ALLOW_PROD_SEED=true for explicit destructive runs.",
    );
  }

  console.log("🌱 Seeding database...");
  await database.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
  try {
    // Clear existing data
    console.log("Emptying tables...");
    try {
      await database.delete(projectTranslation);
      await database.delete(_projectToSkill);
      await database.delete(project);
      await database.delete(blogPostTranslation);
      await database.delete(blogPost);
      await database.delete(workExperienceTranslation);
      await database.delete(workExperience);
      await database.delete(questTranslation);
      await database.delete(quest);
      await database.delete(profileTranslation);
      await database.delete(socialLink);
      await database.delete(profile);
      await database.delete(skill);
      await database.delete(category);
    } catch {
      console.log("Tables might not exist yet, skipping delete...");
    }

    // 1. Skills
    console.log("Seeding skills...");
    const skillsRes = await database
      .insert(skill)
      .values([
        {
          key: "nextjs",
          name: "Next.js",
          icon: "https://cdn.simpleicons.org/nextdotjs/000000",
        },
        {
          key: "typescript",
          name: "TypeScript",
          icon: "https://cdn.simpleicons.org/typescript/2496ED",
        },
        {
          key: "tailwind",
          name: "Tailwind CSS",
          icon: "https://cdn.simpleicons.org/tailwindcss/61DAFB",
        },
        {
          key: "drizzle",
          name: "Drizzle ORM",
          icon: "https://cdn.simpleicons.org/drizzle/C5F74F",
        },
        {
          key: "postgresql",
          name: "PostgreSQL",
          icon: "https://cdn.simpleicons.org/postgresql/336791",
        },
        {
          key: "docker",
          name: "Docker",
          icon: "https://cdn.simpleicons.org/docker/2496ED",
        },
        {
          key: "react",
          name: "React",
          icon: "https://cdn.simpleicons.org/react/61DAFB",
        },
        {
          key: "nodejs",
          name: "Node.js",
          icon: "https://cdn.simpleicons.org/nodejs/339933",
        },
      ])
      .returning();

    const skillMap = new Map(skillsRes.map((s) => [s.key, s.id]));

    // 2. Profile
    console.log("Seeding profile...");
    const [myProfile] = await database
      .insert(profile)
      .values({
        email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com",
        github: "https://github.com/autumnnus",
        linkedin: "https://linkedin.com/in/autumnnus",
      })
      .returning();

    await database.insert(profileTranslation).values([
      {
        profileId: myProfile.id,
        language: "tr",
        name: "Kadir",
        title: "Full Stack Developer",
        greetingText: "Selam, ben Kadir!",
        description:
          "Modern web teknolojileri ile kullanıcı dostu uygulamalar geliştiriyorum.",
        aboutTitle: "Hakkımda",
        aboutDescription:
          "Yazılım dünyasına olan tutkumla her gün yeni şeyler öğreniyor ve projeler üretiyorum.",
      },
      {
        profileId: myProfile.id,
        language: "en",
        name: "Kadir",
        title: "Full Stack Developer",
        greetingText: "Hi, I'm Kadir!",
        description:
          "I build user-friendly applications with modern web technologies.",
        aboutTitle: "About Me",
        aboutDescription:
          "With my passion for the software world, I learn new things and produce projects every day.",
      },
    ]);

    // 3. Quests
    console.log("Seeding quests...");
    const questsRes = await database
      .insert(quest)
      .values([
        { profileId: myProfile.id, order: 1, completed: true },
        { profileId: myProfile.id, order: 2, completed: false },
      ])
      .returning();

    await database.insert(questTranslation).values([
      {
        questId: questsRes[0].id,
        language: "tr",
        title: "İlk Proje Tamamlandı",
      },
      {
        questId: questsRes[0].id,
        language: "en",
        title: "First Project Completed",
      },
      {
        questId: questsRes[1].id,
        language: "tr",
        title: "Drizzle Göçü",
      },
      {
        questId: questsRes[1].id,
        language: "en",
        title: "Drizzle Migration",
      },
    ] as any);

    // 4. Social Links
    console.log("Seeding social links...");
    await database.insert(socialLink).values([
      {
        key: "github",
        name: "GitHub",
        href: "https://github.com/autumnnus",
        icon: "https://cdn.simpleicons.org/github/181717",
      },
      {
        key: "linkedin",
        name: "LinkedIn",
        href: "https://linkedin.com/in/autumnnus",
        icon: "https://s.magecdn.com/social/tc-linkedin.svg",
      },
    ] as any);

    // 5. Work Experience
    console.log("Seeding work experience...");
    const experiencesRes = await database
      .insert(workExperience)
      .values([
        {
          company: "Tech Solutions",
          startDate: new Date("2022-01-01"),
          endDate: null,
        },
      ])
      .returning();

    await database.insert(workExperienceTranslation).values([
      {
        workExperienceId: experiencesRes[0].id,
        language: "tr",
        role: "Senior Developer",
        description: "Büyük ölçekli web uygulamaları geliştirme.",
        locationType: "Remote",
      },
      {
        workExperienceId: experiencesRes[0].id,
        language: "en",
        role: "Senior Developer",
        description: "Developing large-scale web applications.",
        locationType: "Remote",
      },
    ]);

    // 5.5 Categories
    console.log("Seeding categories...");
    const categoriesRes = await database
      .insert(category)
      .values([
        { name: "Web Development", type: "project" },
        { name: "Mobile App", type: "project" },
        { name: "DevOps", type: "project" },
        { name: "Software Engineering", type: "blog" },
        { name: "Tutorial", type: "blog" },
        { name: "AI & Machine Learning", type: "blog" },
      ])
      .returning();

    const projectCatMap = new Map(
      categoriesRes
        .filter((c) => c.type === "project")
        .map((c) => [c.name, c.id]),
    );
    const blogCatMap = new Map(
      categoriesRes.filter((c) => c.type === "blog").map((c) => [c.name, c.id]),
    );

    // 6. Projects
    console.log("Seeding projects...");
    const projectsRes = await database
      .insert(project)
      .values([
        {
          slug: "autumnnus-portfolio",
          status: "Completed",
          categoryId: projectCatMap.get("Web Development"),
          github: "https://github.com/autumnnus/portfolio",
          liveDemo: "https://portfolio.example.com",
          featured: true,
        },
      ])
      .returning();

    await database.insert(projectTranslation).values([
      {
        projectId: projectsRes[0].id,
        language: "tr",
        title: "Autumnnus Portfolio",
        shortDescription: "Modern ve şık bir portfolyo teması.",
        fullDescription:
          "Next.js 15, Drizzle ORM ve Tailwind CSS kullanılarak geliştirildi.",
      },
      {
        projectId: projectsRes[0].id,
        language: "en",
        title: "Autumnnus Portfolio",
        shortDescription: "A modern and sleek portfolio theme.",
        fullDescription:
          "Developed using Next.js 15, Drizzle ORM and Tailwind CSS.",
      },
    ]);

    const projectSkills = [
      "nextjs",
      "typescript",
      "tailwind",
      "drizzle",
      "postgresql",
    ];
    await database.insert(_projectToSkill).values(
      projectSkills.map((key) => ({
        A: projectsRes[0].id,
        B: skillMap.get(key)!,
      })),
    );

    // 7. Blog Posts
    console.log("Seeding blog posts...");
    const blogsRes = await database
      .insert(blogPost)
      .values([
        {
          slug: "why-drizzle-orm",
          featured: true,
          tags: ["drizzle", "orm", "typescript"],
          status: "published",
          categoryId: blogCatMap.get("Software Engineering"),
        },
      ])
      .returning();

    await database.insert(blogPostTranslation).values([
      {
        blogPostId: blogsRes[0].id,
        language: "tr",
        title: "Neden Drizzle ORM?",
        description:
          "Drizzle ORM'in avantajları ve Prisma ile karşılaştırması.",
        content: "Drizzle ORM, hafif ve tip güvenli bir ORM çözümüdür...",
        readTime: "5 dk",
        date: formatDate(new Date(), undefined, "tr-TR"),
      },
      {
        blogPostId: blogsRes[0].id,
        language: "en",
        title: "Why Drizzle ORM?",
        description: "Advantages of Drizzle ORM and comparison with Prisma.",
        content: "Drizzle ORM is a lightweight and type-safe ORM solution...",
        readTime: "5 min",
        date: formatDate(new Date(), undefined, "en-US"),
      },
    ]);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

async function main() {
  await seedDatabase();
}

const isDirectExecution =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
