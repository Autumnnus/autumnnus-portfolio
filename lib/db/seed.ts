/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { db } from "./index";
import {
  _projectToSkill,
  blogPost,
  blogPostTranslation,
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

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    console.log("Emptying tables...");
    await db.delete(projectTranslation);
    await db.delete(_projectToSkill);
    await db.delete(project);
    await db.delete(blogPostTranslation);
    await db.delete(blogPost);
    await db.delete(workExperienceTranslation);
    await db.delete(workExperience);
    await db.delete(questTranslation);
    await db.delete(quest);
    await db.delete(profileTranslation);
    await db.delete(socialLink);
    await db.delete(profile);
    await db.delete(skill);

    // 1. Skills
    console.log("Seeding skills...");
    const skillsRes = await db
      .insert(skill)
      .values([
        { key: "nextjs", name: "Next.js", icon: "simpleicons:nextdotjs" },
        {
          key: "typescript",
          name: "TypeScript",
          icon: "simpleicons:typescript",
        },
        {
          key: "tailwind",
          name: "Tailwind CSS",
          icon: "simpleicons:tailwindcss",
        },
        { key: "drizzle", name: "Drizzle ORM", icon: "simpleicons:drizzle" },
        {
          key: "postgresql",
          name: "PostgreSQL",
          icon: "simpleicons:postgresql",
        },
        { key: "docker", name: "Docker", icon: "simpleicons:docker" },
        { key: "react", name: "React", icon: "simpleicons:react" },
        { key: "nodejs", name: "Node.js", icon: "simpleicons:nodedotjs" },
      ])
      .returning();

    const skillMap = new Map(skillsRes.map((s) => [s.key, s.id]));

    // 2. Profile
    console.log("Seeding profile...");
    const [myProfile] = await db
      .insert(profile)
      .values({
        email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com",
        avatar: "/assets/avatar.png",
        github: "https://github.com/autumnnus",
        linkedin: "https://linkedin.com/in/autumnnus",
      })
      .returning();

    await db.insert(profileTranslation).values([
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
    const questsRes = await db
      .insert(quest)
      .values([
        { profileId: myProfile.id, order: 1, completed: true },
        { profileId: myProfile.id, order: 2, completed: false },
      ])
      .returning();

    await db.insert(questTranslation).values([
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
    await db.insert(socialLink).values([
      {
        key: "github",
        name: "GitHub",
        href: "https://github.com/autumnnus",
        icon: "simpleicons:github",
      },
      {
        key: "linkedin",
        name: "LinkedIn",
        href: "https://linkedin.com/in/autumnnus",
        icon: "simpleicons:linkedin",
      },
    ] as any);

    // 5. Work Experience
    console.log("Seeding work experience...");
    const experiencesRes = await db
      .insert(workExperience)
      .values([
        {
          company: "Tech Solutions",
          logo: "/assets/tech-solutions.png",
          startDate: new Date("2022-01-01"),
          endDate: null,
        },
      ])
      .returning();

    await db.insert(workExperienceTranslation).values([
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

    // 6. Projects
    console.log("Seeding projects...");
    const projectsRes = await db
      .insert(project)
      .values([
        {
          slug: "autumnnus-portfolio",
          status: "completed",
          category: "web",
          github: "https://github.com/autumnnus/portfolio",
          liveDemo: "https://portfolio.example.com",
          featured: true,
          coverImage: "/assets/portfolio-cover.png",
          images: ["/assets/portfolio-1.png", "/assets/portfolio-2.png"],
        },
      ])
      .returning();

    await db.insert(projectTranslation).values([
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
    await db.insert(_projectToSkill).values(
      projectSkills.map((key) => ({
        A: projectsRes[0].id,
        B: skillMap.get(key)!,
      })),
    );

    // 7. Blog Posts
    console.log("Seeding blog posts...");
    const blogsRes = await db
      .insert(blogPost)
      .values([
        {
          slug: "why-drizzle-orm",
          coverImage: "/assets/drizzle-blog.png",
          featured: true,
          tags: ["drizzle", "orm", "typescript"],
          status: "published",
        },
      ])
      .returning();

    await db.insert(blogPostTranslation).values([
      {
        blogPostId: blogsRes[0].id,
        language: "tr",
        title: "Neden Drizzle ORM?",
        description:
          "Drizzle ORM'in avantajları ve Prisma ile karşılaştırması.",
        content: "Drizzle ORM, hafif ve tip güvenli bir ORM çözümüdür...",
        readTime: "5 dk",
        date: new Date().toLocaleDateString("tr-TR"),
      },
      {
        blogPostId: blogsRes[0].id,
        language: "en",
        title: "Why Drizzle ORM?",
        description: "Advantages of Drizzle ORM and comparison with Prisma.",
        content: "Drizzle ORM is a lightweight and type-safe ORM solution...",
        readTime: "5 min",
        date: new Date().toLocaleDateString("en-US"),
      },
    ]);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
