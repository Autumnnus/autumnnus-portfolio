import { Language, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Profile
  await prisma.profile.upsert({
    where: { id: "default-profile" },
    update: {},
    create: {
      id: "default-profile",
      avatar: "https://github.com/autumnnus.png",
      email: "hello@kadir.dev",
      github: "https://github.com/autumnnus",
      linkedin: "https://linkedin.com/in/autumnnus",
      translations: {
        createMany: {
          data: [
            {
              language: Language.tr,
              name: "Kadir",
              title: "Full-Stack Developer",
              greetingText: "Merhaba, ben ",
              description:
                "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum.",
              aboutTitle: "Beni Tanıyın",
              aboutDescription:
                "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. Uzmanlığım, React, Zustand ve TypeScript ile frontend geliştirmenin yanı sıra Node.js, MongoDB ve Spring Boot ile backend sistemlerini kapsamaktadır.",
            },
            {
              language: Language.en,
              name: "Kadir",
              title: "Full-Stack Developer",
              greetingText: "Hello, I'm ",
              description:
                "I code like autumn leaves falling. Building web applications and designing user experiences.",
              aboutTitle: "Get to Know Me",
              aboutDescription:
                "I'm a Full-Stack Developer passionate about building scalable, user-centric applications. My expertise spans frontend development with React, Zustand, and TypeScript, as well as backend systems with Node.js, MongoDB, and Spring Boot.",
            },
          ],
        },
      },
    },
  });
  console.log("✅ Profile seeded");

  // 2. Quests
  const quests = [
    {
      order: 1,
      completed: true,
      translations: {
        createMany: {
          data: [
            { language: Language.tr, title: "Modern Portfolyo Yayınlandı" },
            { language: Language.en, title: "Modern Portfolio Released" },
          ],
        },
      },
    },
    {
      order: 2,
      completed: false,
      translations: {
        createMany: {
          data: [
            {
              language: Language.tr,
              title: "AI Chat Entegrasyonu Tamamlanıyor",
            },
            { language: Language.en, title: "Completing AI Chat Integration" },
          ],
        },
      },
    },
  ];

  for (const q of quests) {
    await prisma.quest.create({
      data: {
        ...q,
        profileId: "default-profile",
      },
    });
  }
  console.log("✅ Quests seeded");

  // 3. Skills
  const skills = [
    {
      key: "react",
      name: "React",
      icon: "https://simpleicons.org/icons/react.svg",
    },
    {
      key: "nextjs",
      name: "Next.js",
      icon: "https://simpleicons.org/icons/nextdotjs.svg",
    },
    {
      key: "typescript",
      name: "TypeScript",
      icon: "https://simpleicons.org/icons/typescript.svg",
    },
    {
      key: "nodejs",
      name: "Node.js",
      icon: "https://simpleicons.org/icons/nodedotjs.svg",
    },
    {
      key: "postgresql",
      name: "PostgreSQL",
      icon: "https://simpleicons.org/icons/postgresql.svg",
    },
    {
      key: "tailwind",
      name: "Tailwind CSS",
      icon: "https://simpleicons.org/icons/tailwindcss.svg",
    },
    {
      key: "prisma",
      name: "Prisma",
      icon: "https://simpleicons.org/icons/prisma.svg",
    },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { key: skill.key },
      update: {},
      create: skill,
    });
  }
  console.log("✅ Skills seeded");

  // 4. Projects
  await prisma.project.upsert({
    where: { slug: "autumnnus-portfolio" },
    update: {},
    create: {
      slug: "autumnnus-portfolio",
      status: "published",
      category: "Full-Stack",
      featured: true,
      technologies: {
        connect: [
          { key: "nextjs" },
          { key: "typescript" },
          { key: "postgresql" },
        ],
      },
      translations: {
        createMany: {
          data: [
            {
              language: Language.tr,
              title: "Autumnnus Portfolyo",
              shortDescription:
                "Yapay zeka destekli modern bir portfolyo uygulaması.",
              fullDescription:
                "React, Next.js ve PgVector kullanılarak geliştirilmiş, çok dilli bir portfolyo platformu.",
            },
            {
              language: Language.en,
              title: "Autumnnus Portfolio",
              shortDescription: "A modern portfolio application powered by AI.",
              fullDescription:
                "A multi-language portfolio platform developed using React, Next.js, and PgVector.",
            },
          ],
        },
      },
    },
  });
  console.log("✅ Projects seeded");

  // 5. Blog Posts
  await prisma.blogPost.upsert({
    where: { slug: "future-of-ai-portfolios" },
    update: {},
    create: {
      slug: "future-of-ai-portfolios",
      status: "published",
      tags: ["AI", "Web Dev"],
      category: "Technology",
      translations: {
        createMany: {
          data: [
            {
              language: Language.tr,
              title: "Yapay Zekalı Portfolyoların Geleceği",
              description:
                "AI entegrasyonu modern geliştirici portfolyolarını nasıl değiştiriyor?",
              content: "Yapay zeka artık bir lüks değil, bir zorunluluk...",
              readTime: "5 min",
              date: "2024-02-20",
            },
            {
              language: Language.en,
              title: "Future of AI Portfolios",
              description:
                "How AI integration is changing modern developer portfolios?",
              content: "AI is no longer a luxury, but a necessity...",
              readTime: "5 min",
              date: "2024-02-20",
            },
          ],
        },
      },
    },
  });
  console.log("✅ Blog Posts seeded");

  // 6. Work Experience
  await prisma.workExperience.create({
    data: {
      company: "Freelance",
      logo: "https://github.com/autumnnus.png",
      startDate: new Date("2022-01-01"),
      translations: {
        createMany: {
          data: [
            {
              language: Language.tr,
              role: "Full-Stack Developer",
              description:
                "Çeşitli müşteriler için web çözümleri geliştirildi.",
              locationType: "Remote",
            },
            {
              language: Language.en,
              role: "Full-Stack Developer",
              description: "Developed web solutions for various clients.",
              locationType: "Remote",
            },
          ],
        },
      },
    },
  });
  console.log("✅ Work Experiences seeded");

  // 7. Live Chat Config
  await prisma.liveChatConfig.upsert({
    where: { id: "global-chat-config" },
    update: {},
    create: {
      id: "global-chat-config",
      isEnabled: true,
      allowedPaths: [],
      greetings: {
        create: {
          pathname: "/",
          translations: {
            createMany: {
              data: [
                {
                  language: Language.tr,
                  text: "Selam! Kadir'in projeleri hakkında ne bilmek istersin?",
                  quickAnswers: [
                    "Hangi teknolojileri kullanıyorsun?",
                    "İletişime geçmek istiyorum.",
                  ],
                },
                {
                  language: Language.en,
                  text: "Hi! What would you like to know about Kadir's projects?",
                  quickAnswers: [
                    "What technologies do you use?",
                    "I want to get in touch.",
                  ],
                },
              ],
            },
          },
        },
      },
    },
  });
  console.log("✅ Live Chat Config seeded");

  // 8. Social Links
  const socialLinks = [
    {
      key: "github",
      name: "GitHub",
      href: "https://github.com/autumnnus",
      icon: "Github",
    },
    {
      key: "linkedin",
      name: "LinkedIn",
      href: "https://linkedin.com/in/autumnnus",
      icon: "Linkedin",
    },
    {
      key: "twitter",
      name: "Twitter",
      href: "https://twitter.com/autumnnus",
      icon: "Twitter",
    },
  ];

  for (const link of socialLinks) {
    await prisma.socialLink.upsert({
      where: { key: link.key },
      update: {},
      create: link,
    });
  }
  console.log("✅ Social Links seeded");

  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
