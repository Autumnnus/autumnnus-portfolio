import { PrismaPg } from "@prisma/adapter-pg";
import { Language, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import { Client } from "minio";
import path from "path";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- MINIO CLIENT SETUP ---
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "autumnnus-assets";

async function uploadFile(
  filename: string,
  buffer: Buffer,
  contentType: string,
) {
  const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME, "");
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetBucketLocation", "s3:ListBucket"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
        },
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }

  await minioClient.putObject(BUCKET_NAME, filename, buffer, undefined, {
    "Content-Type": contentType,
  });

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  // Use localhost for local dev access if running outside docker, or 127.0.0.1
  return `${protocol}://127.0.0.1:${process.env.MINIO_PORT}/${BUCKET_NAME}/${filename}`;
}

// --- DATA ---
const SKILLS = {
  TYPESCRIPT: {
    name: "TypeScript",
    icon: "https://cdn.simpleicons.org/typescript/3178C6",
    key: "TYPESCRIPT",
  },
  REACT: {
    name: "React",
    icon: "https://cdn.simpleicons.org/react/61DAFB",
    key: "REACT",
  },
  NEXTJS: {
    name: "Next.js",
    icon: "https://cdn.simpleicons.org/nextdotjs/000000",
    key: "NEXTJS",
  },
  NODEJS: {
    name: "Node.js",
    icon: "https://cdn.simpleicons.org/nodedotjs/339933",
    key: "NODEJS",
  },
  POSTGRES: {
    name: "PostgreSQL",
    icon: "https://cdn.simpleicons.org/postgresql/4169E1",
    key: "POSTGRES",
  },
  TAILWIND: {
    name: "Tailwind CSS",
    icon: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
    key: "TAILWIND",
  },
  JAVA: {
    name: "Java",
    icon: "https://cdn.simpleicons.org/openjdk/000000",
    key: "JAVA",
  },
  SPRING_BOOT: {
    name: "Spring Boot",
    icon: "https://cdn.simpleicons.org/springboot/6DB33F",
    key: "SPRING_BOOT",
  },
  MONGODB: {
    name: "MongoDB",
    icon: "https://cdn.simpleicons.org/mongodb/47A248",
    key: "MONGODB",
  },
  EXPRESS: {
    name: "Express.js",
    icon: "https://cdn.simpleicons.org/express/000000",
    key: "EXPRESS",
  },
  AWS: {
    name: "AWS",
    icon: "https://cdn.simpleicons.org/amazonaws/232F3E",
    key: "AWS",
  },
  REDUX: {
    name: "Redux",
    icon: "https://cdn.simpleicons.org/redux/764ABC",
    key: "REDUX",
  },
  GRAPHQL: {
    name: "GraphQL",
    icon: "https://cdn.simpleicons.org/graphql/E10098",
    key: "GRAPHQL",
  },
  FIREBASE: {
    name: "Firebase",
    icon: "https://cdn.simpleicons.org/firebase/FFCA28",
    key: "FIREBASE",
  },
  JAVASCRIPT: {
    name: "JavaScript",
    icon: "https://cdn.simpleicons.org/javascript/F7DF1E",
    key: "JAVASCRIPT",
  },
  MATERIAL_UI: {
    name: "Material UI",
    icon: "https://cdn.simpleicons.org/mui/007FFF",
    key: "MATERIAL_UI",
  },
};

const PROJECTS_DATA = [
  {
    slug: "e-commerce-api",
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed",
    category: "Backend",
    github: "https://github.com/Autumnnus/e-commerce-api",
    liveDemo:
      "https://e-commerce-rest-api-68700e98743e.herokuapp.com/swagger-ui/index.html#",
    featured: true,
    translations: {
      tr: {
        title: "E-Commerce API",
        shortDescription: "Spring Boot ile geliştirilmiş E-Ticaret API'si",
        fullDescription:
          "A comprehensive E-Commerce REST API developed using Spring Boot and PostgreSQL.",
      },
      en: {
        title: "E-Commerce API",
        shortDescription: "E-Commerce API built with Spring Boot",
        fullDescription:
          "A comprehensive E-Commerce REST API developed using Spring Boot and PostgreSQL.",
      },
    },
    imagePaths: [],
  },
  {
    slug: "my-games",
    technologies: [SKILLS.REACT, SKILLS.TYPESCRIPT, SKILLS.MATERIAL_UI],
    status: "Completed",
    category: "Frontend",
    github: "https://github.com/Autumnnus/my-games",
    liveDemo: "https://my-games.netlify.app/",
    featured: true,
    translations: {
      tr: {
        title: "My Games",
        shortDescription: "Oyun koleksiyonu yönetim platformu",
        fullDescription:
          "Oyuncuların oyun verilerini saklayabileceği ve yönetebileceği, React ile geliştirilmiş web uygulaması.",
      },
      en: {
        title: "My Games",
        shortDescription: "Game collection management platform",
        fullDescription:
          "Web application developed with React where players can store and manage their game data.",
      },
    },
    imagePaths: [
      "assets/projects/my-games/index-1.png",
      "assets/projects/my-games/index-2.png",
      "assets/projects/my-games/index-3.png",
    ],
  },
];

const BLOG_DATA = [
  {
    slug: "hello-world",
    coverImagePath: "assets/blog/test.png", // Verify path
    featured: true,
    tags: ["Career", "Software"],
    translations: {
      tr: {
        title: "Merhaba Dünya: Yazılım Yolculuğum",
        description: "Yazılım dünyasına nasıl adım attım ve neler öğrendim?",
        date: "17 Ocak 2026",
        readTime: "5 dk okuma",
        content: `
## Yazılım Dünyasına Giriş
Yazılım dünyasına attığım ilk adım...
`,
      },
      en: {
        title: "Hello World: My Software Journey",
        description:
          "How I stepped into the world of software and what I learned.",
        date: "January 17, 2026",
        readTime: "5 min read",
        content: `
## Entering the Software World
My first step into the world of software...
`,
      },
    },
  },
];

const WORK_DATA = [
  {
    company: "Qpien",
    logo: "https://framerusercontent.com/images/Fsa1ndV2XvTCGEdC1yz0u87Qg.png",
    translations: {
      tr: {
        role: "Full Stack Developer",
        period: "Şub 2024 - Günümüz",
        locationType: "Hibrit",
        description:
          "- React, Zustand ve React Hook Form kullanarak kullanıcı dostu arayüzler geliştirdim.",
      },
      en: {
        role: "Full Stack Developer",
        period: "Feb 2024 - Present",
        locationType: "Hybrid",
        description:
          "- Built user-friendly frontend interfaces using React, Zustand, and React Hook Form.",
      },
    },
  },
];

async function main() {
  console.log("Starting seed with standalone configuration...");

  // Seed Skills
  for (const key in SKILLS) {
    const skill = SKILLS[key as keyof typeof SKILLS];
    await prisma.skill.upsert({
      where: { key: skill.key },
      update: {},
      create: {
        key: skill.key,
        name: skill.name,
        icon: skill.icon,
      },
    });
  }
  console.log("Skills seeded.");

  // Seed Projects
  for (const p of PROJECTS_DATA) {
    const uploadedImages: string[] = [];
    for (const relativePath of p.imagePaths) {
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const filename = `projects/${p.slug}/${path.basename(filePath)}`;
        const ext = path.extname(filePath).toLowerCase();
        const contentType =
          ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : "application/octet-stream";

        try {
          const url = await uploadFile(filename, buffer, contentType);
          uploadedImages.push(url);
          console.log(`Uploaded ${filename} to ${url}`);
        } catch (e) {
          console.error(`Failed to upload ${filePath}:`, e);
        }
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        images: uploadedImages,
        coverImage: uploadedImages.length > 0 ? uploadedImages[0] : null,
      },
      create: {
        slug: p.slug,
        status: p.status,
        category: p.category,
        github: p.github,
        liveDemo: p.liveDemo,
        featured: p.featured,
        images: uploadedImages,
        coverImage: uploadedImages.length > 0 ? uploadedImages[0] : null,
        technologies: {
          connect: p.technologies.map((t) => ({ key: t.key })),
        },
        translations: {
          create: [
            {
              language: Language.tr,
              title: p.translations.tr.title,
              shortDescription: p.translations.tr.shortDescription,
              fullDescription: p.translations.tr.fullDescription,
            },
            {
              language: Language.en,
              title: p.translations.en.title,
              shortDescription: p.translations.en.shortDescription,
              fullDescription: p.translations.en.fullDescription,
            },
          ],
        },
      },
    });
    console.log(`Seeded project: ${p.slug}`);
  }

  // Seed Blog
  for (const b of BLOG_DATA) {
    let coverImageUrl = null;
    const filePath = path.join(process.cwd(), b.coverImagePath);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const filename = `blog/${b.slug}/${path.basename(filePath)}`;
      coverImageUrl = await uploadFile(filename, buffer, "image/png");
    } else {
      console.warn(`File not found: ${filePath}`);
    }

    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {
        coverImage: coverImageUrl,
      },
      create: {
        slug: b.slug,
        featured: b.featured,
        tags: b.tags,
        coverImage: coverImageUrl,
        translations: {
          create: [
            {
              language: Language.tr,
              title: b.translations.tr.title,
              description: b.translations.tr.description,
              content: b.translations.tr.content,
              date: b.translations.tr.date,
              readTime: b.translations.tr.readTime,
            },
            {
              language: Language.en,
              title: b.translations.en.title,
              description: b.translations.en.description,
              content: b.translations.en.content,
              date: b.translations.en.date,
              readTime: b.translations.en.readTime,
            },
          ],
        },
      },
    });
    console.log(`Seeded blog post: ${b.slug}`);
  }

  // Seed Work
  for (const w of WORK_DATA) {
    await prisma.workExperience.create({
      data: {
        company: w.company,
        logo: w.logo,
        translations: {
          create: [
            {
              language: Language.tr,
              role: w.translations.tr.role,
              description: w.translations.tr.description,
              period: w.translations.tr.period,
              locationType: w.translations.tr.locationType,
            },
            {
              language: Language.en,
              role: w.translations.en.role,
              description: w.translations.en.description,
              period: w.translations.en.period,
              locationType: w.translations.en.locationType,
            },
          ],
        },
      },
    });
    console.log(`Seeded work experience: ${w.company}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
