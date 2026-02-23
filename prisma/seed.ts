import { Language, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
                },
                {
                  language: Language.en,
                  text: "Hi! What would you like to know about Kadir's projects?",
                },
              ],
            },
          },
        },
      },
    },
  });
  console.log("✅ Live Chat Config seeded");

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
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { key: skill.key },
      update: {},
      create: skill,
    });
  }
  console.log("✅ Skills seeded");

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
