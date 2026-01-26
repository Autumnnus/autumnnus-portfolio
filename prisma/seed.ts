import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WORK_DATA = [
  {
    company: "Qpien",
    logo: "https://framerusercontent.com/images/Fsa1ndV2XvTCGEdC1yz0u87Qg.png",
    translations: [
      {
        language: "tr",
        role: "Full Stack Developer",
        description: `
- React, Zustand ve React Hook Form kullanarak kullanıcı dostu arayüzler geliştirdim.
- Node.js ve MongoDB ile ölçeklenebilir backend API’leri oluşturdum.
- OpenAI, Embeddings ve Pinecone kullanarak RAG kontrollü bir AI modülünün temelini ve geliştirilmesini destekledim.
- Clean Code, SOLID ve katmanlı mimari prensiplerini (Onion Architecture, CQRS) uyguladım.
- Ekip içi iş birliği için Jira, Bitbucket ve GraphQL gibi araçları etkin şekilde kullandım.
        `.trim(),
        period: "Şub 2024 - Günümüz",
        locationType: "Hibrit",
      },
      {
        language: "en",
        role: "Full Stack Developer",
        description: `
- Built user-friendly frontend interfaces using React, Zustand, and React Hook Form.
- Developed scalable backend APIs with Node.js and MongoDB.
- Contributed to the foundation and development of an AI module powered by RAG using OpenAI, Embeddings, and Pinecone.
- Applied Clean Code, SOLID, and layered architecture principles (Onion Architecture, CQRS).
- Effectively collaborated using tools such as Jira, Bitbucket, and GraphQL.
        `.trim(),
        period: "Feb 2024 - Present",
        locationType: "Hybrid",
      },
    ],
  },
];

const PROFILE_DATA = {
  avatar: "https://github.com/Autumnnus.png", // Using a placeholder that works
  email: "akadir.38@gmail.com",
  github: "https://github.com/Autumnnus",
  linkedin: "https://www.linkedin.com/in/kadir-topcu/",
  translations: [
    {
      language: "tr",
      name: "Kadir",
      title: "Full Stack Developer",
      greetingText: "Merhaba, ben ",
      description:
        "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum.",
      aboutTitle: "Hakkımda",
      aboutDescription:
        "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. Uzmanlığım, React, Zustand ve TypeScript ile frontend geliştirmenin yanı sıra Node.js, MongoDB ve Spring Boot ile backend sistemlerini kapsamaktadır.\n Mevcut rolümde, sezgisel kullanıcı arayüzü bileşenlerinden sağlam API servislerine kadar uçtan uca özellikler tasarlıyor ve uyguluyorum. Ayrıca OpenAI embedding'leri ve Pinecone'u entegre ederek daha akıllı arama ve bilgi yönetimi çözümleri sunan yapay zeka destekli modüllere katkıda bulundum.\n Temiz mimari prensipleriyle (SOLID, CQRS, Onion Architecture) çalışmaktan keyif alıyor ve sürekli olarak sürdürülebilir, yüksek kaliteli kod yazmayı hedefliyorum. Teknik becerilerin ötesinde, çevik (agile) ekipler içinde iş birliğine ve etkili problem çözmeye değer veriyorum.\n Şu anda, gelişen teknolojilere dair merakımı korurken, yapay zeka entegrasyonları ve ölçeklenebilir backend sistemleri konusundaki uzmanlığımı geliştiriyorum.",
    },
    {
      language: "en",
      name: "Kadir",
      title: "Full Stack Developer",
      greetingText: "Hello, I'm ",
      description:
        "I code like autumn leaves falling. Building web applications and designing user experiences.",
      aboutTitle: "About Me",
      aboutDescription:
        "I’m a Full-Stack Developer passionate about building scalable, user-centric applications. My expertise spans frontend development with React, Zustand, and TypeScript, as well as backend systems with Node.js, MongoDB, and Spring Boot.\n At my current role, I design and implement end-to-end features — from intuitive UI components to robust API services. I’ve also contributed to AI-powered modules by integrating OpenAI embeddings and Pinecone, enabling smarter search and knowledge management solutions.\n I enjoy working with clean architecture principles (SOLID, CQRS, Onion Architecture) and continuously seek to write maintainable, high-quality code. Beyond technical skills, I value collaboration and effective problem-solving within agile teams.\n Currently, I’m expanding my expertise in AI integrations and scalable backend systems while staying curious about emerging technologies.",
    },
  ],
};

async function main() {
  console.log("Start seeding...");

  // Clear existing data
  await prisma.workExperienceTranslation.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.profileTranslation.deleteMany();
  await prisma.profile.deleteMany();

  console.log("Deleted old data.");

  // Seed Profile
  await prisma.profile.create({
    data: {
      avatar: PROFILE_DATA.avatar,
      email: PROFILE_DATA.email,
      github: PROFILE_DATA.github,
      linkedin: PROFILE_DATA.linkedin,
      translations: {
        create: PROFILE_DATA.translations.map((t) => ({
          language: t.language as any,
          name: t.name,
          title: t.title,
          greetingText: t.greetingText,
          description: t.description,
          aboutTitle: t.aboutTitle,
          aboutDescription: t.aboutDescription,
        })),
      },
    },
  });
  console.log("Profile created.");

  // Seed Work Experience
  for (const work of WORK_DATA) {
    await prisma.workExperience.create({
      data: {
        company: work.company,
        logo: work.logo,
        translations: {
          create: work.translations.map((t) => ({
            language: t.language as any,
            role: t.role,
            description: t.description,
            period: t.period,
            locationType: t.locationType,
          })),
        },
      },
    });
  }
  console.log("Work experiences created.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
