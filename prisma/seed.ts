import { Language, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✅ pgvector extension enabled");

  // 1. Skills
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
    {
      key: "docker",
      name: "Docker",
      icon: "https://simpleicons.org/icons/docker.svg",
    },
    {
      key: "redis",
      name: "Redis",
      icon: "https://simpleicons.org/icons/redis.svg",
    },
    {
      key: "graphql",
      name: "GraphQL",
      icon: "https://simpleicons.org/icons/graphql.svg",
    },
    {
      key: "mongodb",
      name: "MongoDB",
      icon: "https://simpleicons.org/icons/mongodb.svg",
    },
    {
      key: "python",
      name: "Python",
      icon: "https://simpleicons.org/icons/python.svg",
    },
    { key: "git", name: "Git", icon: "https://simpleicons.org/icons/git.svg" },
    {
      key: "minio",
      name: "MinIO",
      icon: "https://simpleicons.org/icons/minio.svg",
    },
    {
      key: "nestjs",
      name: "NestJS",
      icon: "https://simpleicons.org/icons/nestjs.svg",
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

  // 2. Profile
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
                "Sonbahar yaprakları gibi kod yazıyorum. Ölçeklenebilir web uygulamaları geliştiriyor, kullanıcı odaklı deneyimler tasarlıyorum.",
              aboutTitle: "Beni Tanıyın",
              aboutDescription:
                "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. React, Next.js, TypeScript ile frontend; Node.js, NestJS, PostgreSQL ile backend geliştirme alanlarında deneyimliyim. AI entegrasyonu ve vektör veritabanları üzerine çalışmalar yapıyorum.",
            },
            {
              language: Language.en,
              name: "Kadir",
              title: "Full-Stack Developer",
              greetingText: "Hello, I'm ",
              description:
                "I write code like autumn leaves falling. Building scalable web applications and designing user-centric experiences.",
              aboutTitle: "Get to Know Me",
              aboutDescription:
                "I'm a Full-Stack Developer passionate about building scalable, user-centric applications. My expertise spans frontend development with React, Next.js, and TypeScript, as well as backend systems with Node.js, NestJS, and PostgreSQL. I work on AI integrations and vector databases.",
            },
          ],
        },
      },
      quests: {
        create: [
          {
            order: 1,
            completed: true,
            translations: {
              createMany: {
                data: [
                  {
                    language: Language.tr,
                    title: "Modern Portfolyo Yayınlandı",
                  },
                  { language: Language.en, title: "Modern Portfolio Released" },
                ],
              },
            },
          },
          {
            order: 2,
            completed: true,
            translations: {
              createMany: {
                data: [
                  {
                    language: Language.tr,
                    title: "AI Chat Asistanı Entegre Edildi",
                  },
                  {
                    language: Language.en,
                    title: "AI Chat Assistant Integrated",
                  },
                ],
              },
            },
          },
          {
            order: 3,
            completed: false,
            translations: {
              createMany: {
                data: [
                  {
                    language: Language.tr,
                    title: "Mobil Uygulama Geliştiriliyor",
                  },
                  { language: Language.en, title: "Mobile App in Development" },
                ],
              },
            },
          },
        ],
      },
    },
  });
  console.log("✅ Profile & Quests seeded");

  // 3. Social Links
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
      name: "Twitter / X",
      href: "https://twitter.com/autumnnus",
      icon: "Twitter",
    },
    {
      key: "email",
      name: "Email",
      href: "mailto:hello@kadir.dev",
      icon: "Mail",
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

  // 4. Work Experience
  const experienceCount = await prisma.workExperience.count();
  if (experienceCount === 0) {
    await prisma.workExperience.createMany({
      data: [
        {
          company: "Freelance",
          logo: "https://github.com/autumnnus.png",
          startDate: new Date("2023-06-01"),
        },
        {
          company: "Tech Startup",
          logo: "https://simpleicons.org/icons/rocket.svg",
          startDate: new Date("2022-01-01"),
          endDate: new Date("2023-05-31"),
        },
      ],
    });

    const [freelance, startup] = await prisma.workExperience.findMany({
      orderBy: { startDate: "desc" },
    });

    if (freelance) {
      await prisma.workExperienceTranslation.createMany({
        data: [
          {
            workExperienceId: freelance.id,
            language: Language.tr,
            role: "Full-Stack Developer",
            description:
              "## Freelance Çalışmalar\n\nÇeşitli müşteriler için **Next.js**, **NestJS** ve **PostgreSQL** teknolojileri ile modern web uygulamaları geliştirildi. AI entegrasyonu, vektör arama sistemleri ve performans optimizasyonu projeleri yürütüldü.",
            locationType: "Remote",
          },
          {
            workExperienceId: freelance.id,
            language: Language.en,
            role: "Full-Stack Developer",
            description:
              "## Freelance Work\n\nDeveloped modern web applications for various clients using **Next.js**, **NestJS**, and **PostgreSQL**. Led AI integration projects, vector search systems, and performance optimization.",
            locationType: "Remote",
          },
        ],
      });
    }

    if (startup) {
      await prisma.workExperienceTranslation.createMany({
        data: [
          {
            workExperienceId: startup.id,
            language: Language.tr,
            role: "Junior Full-Stack Developer",
            description:
              "## Tech Startup\n\n**React** ve **Node.js** kullanarak SaaS ürünler geliştirildi. Agile metodoloji ile çalışıldı, unit ve entegrasyon testleri yazıldı.",
            locationType: "Hybrid",
          },
          {
            workExperienceId: startup.id,
            language: Language.en,
            role: "Junior Full-Stack Developer",
            description:
              "## Tech Startup\n\nBuilt SaaS products using **React** and **Node.js**. Worked with Agile methodology, wrote unit and integration tests.",
            locationType: "Hybrid",
          },
        ],
      });
    }
  }
  console.log("✅ Work Experiences seeded");

  // 5. Projects
  const projectsToCreate = [
    {
      slug: "autumnnus-portfolio",
      status: "Working",
      category: "Full-Stack",
      featured: true,
      github: "https://github.com/autumnnus/autumnnus-portfolio",
      liveDemo: "https://kadir-topcu.autumnnus.dev",
      technologies: [
        "nextjs",
        "typescript",
        "postgresql",
        "prisma",
        "tailwind",
      ],
      translations: [
        {
          language: Language.tr,
          title: "Autumnnus Portfolyo",
          shortDescription:
            "Next.js, pgvector ve Gemini AI ile geliştirilmiş, çok dilli modern portfolyo platformu.",
          fullDescription:
            "## Proje Hakkında\n\n**Autumnnus Portfolio**, modern web teknolojileri ve yapay zeka entegrasyonu ile geliştirilmiş kapsamlı bir kişisel portfolyo platformudur.\n\n## Özellikler\n\n- 🌍 Türkçe ve İngilizce çok dil desteği\n- 🤖 Gemini AI ile içerik çevirisi ve embedding\n- 🔍 pgvector ile semantik arama ve benzer içerik önerileri\n- 💬 Gerçek zamanlı AI chat asistanı\n- 📊 Admin paneli ile içerik yönetimi\n- 🔒 GitHub OAuth ile güvenli kimlik doğrulama\n- 📈 Ziyaretçi takibi ve görüntüleme sayacı\n- 🚀 Coolify ile self-hosted deployment\n\n## Teknolojiler\n\nNext.js 15, TypeScript, Prisma, PostgreSQL, pgvector, MinIO, Docker, Tailwind CSS",
          metaTitle:
            "Autumnnus Portfolyo - Kadir'in Full-Stack Developer Portfolyosu",
          metaDescription:
            "Next.js, pgvector ve Gemini AI ile geliştirilmiş modern portfolyo platformu. Projeler, blog ve deneyimler.",
          keywords: [
            "portfolio",
            "nextjs",
            "full-stack",
            "typescript",
            "pgvector",
          ],
        },
        {
          language: Language.en,
          title: "Autumnnus Portfolio",
          shortDescription:
            "A modern, multi-language portfolio platform built with Next.js, pgvector, and Gemini AI.",
          fullDescription:
            "## About the Project\n\n**Autumnnus Portfolio** is a comprehensive personal portfolio platform built with modern web technologies and AI integration.\n\n## Features\n\n- 🌍 Multi-language support (Turkish & English)\n- 🤖 Content translation and embedding with Gemini AI\n- 🔍 Semantic search and similar content suggestions with pgvector\n- 💬 Real-time AI chat assistant\n- 📊 Content management with admin panel\n- 🔒 Secure authentication with GitHub OAuth\n- 📈 Visitor tracking and view counter\n- 🚀 Self-hosted deployment with Coolify\n\n## Technologies\n\nNext.js 15, TypeScript, Prisma, PostgreSQL, pgvector, MinIO, Docker, Tailwind CSS",
          metaTitle:
            "Autumnnus Portfolio - Kadir's Full-Stack Developer Portfolio",
          metaDescription:
            "Modern portfolio platform built with Next.js, pgvector, and Gemini AI. Projects, blog and experiences.",
          keywords: [
            "portfolio",
            "nextjs",
            "full-stack",
            "typescript",
            "pgvector",
          ],
        },
      ],
    },
    {
      slug: "swiss-knife",
      status: "Completed",
      category: "Full-Stack",
      featured: true,
      github: "https://github.com/autumnnus/swiss-knife",
      technologies: ["nodejs", "typescript", "mongodb", "graphql", "docker"],
      translations: [
        {
          language: Language.tr,
          title: "Swiss Knife",
          shortDescription:
            "GraphQL ve NestJS tabanlı, çok kiracılı (multi-tenant) bir müşteri iletişim platformu.",
          fullDescription:
            "## Proje Hakkında\n\n**Swiss Knife**, modern işletmeler için geliştirilmiş çok kiracılı bir iletişim platformudur. Telefon, e-posta ve canlı sohbet kanallarını tek bir arayüzde birleştiren güçlü bir backend sistemidir.\n\n## Özellikler\n\n- 📞 IVR (Etkileşimli Sesli Yanıt) sistemi\n- 💬 Gerçek zamanlı canlı chat entegrasyonu\n- 🎙️ Ses transkripsiyon ve AI analizi\n- 📊 Çağrı geçmişi ve analitik raporlama\n- 🔀 Çok kanallı yönlendirme (omnichannel routing)\n- 👤 Temsilci yönetim sistemi\n- 🤖 LLM destekli kapanış konusu üretimi\n\n## Teknolojiler\n\nNestJS, TypeScript, GraphQL, MongoDB, Redis, Docker",
          metaTitle: "Swiss Knife - Çok Kiracılı İletişim Platformu",
          metaDescription:
            "GraphQL ve NestJS ile geliştirilmiş, telefon, e-posta ve live chat entegre eden çok kiracılı iletişim platformu.",
          keywords: [
            "nestjs",
            "graphql",
            "mongodb",
            "iletişim platformu",
            "ivr",
            "multi-tenant",
          ],
        },
        {
          language: Language.en,
          title: "Swiss Knife",
          shortDescription:
            "A multi-tenant customer communication platform built with GraphQL and NestJS.",
          fullDescription:
            "## About the Project\n\n**Swiss Knife** is a multi-tenant communication platform developed for modern businesses. It's a powerful backend system that consolidates phone, email, and live chat channels into a single interface.\n\n## Features\n\n- 📞 IVR (Interactive Voice Response) system\n- 💬 Real-time live chat integration\n- 🎙️ Voice transcription and AI analysis\n- 📊 Call history and analytics reporting\n- 🔀 Omnichannel routing\n- 👤 Agent management system\n- 🤖 LLM-powered closing topic generation\n\n## Technologies\n\nNestJS, TypeScript, GraphQL, MongoDB, Redis, Docker",
          metaTitle: "Swiss Knife - Multi-Tenant Communication Platform",
          metaDescription:
            "Multi-tenant communication platform integrating phone, email and live chat, built with GraphQL and NestJS.",
          keywords: [
            "nestjs",
            "graphql",
            "mongodb",
            "communication platform",
            "ivr",
            "multi-tenant",
          ],
        },
      ],
    },
  ];

  for (const proj of projectsToCreate) {
    const existing = await prisma.project.findUnique({
      where: { slug: proj.slug },
    });
    if (existing) continue;

    const { technologies, translations, ...projectData } = proj;
    await prisma.project.create({
      data: {
        ...projectData,
        images: [],
        technologies: {
          connect: technologies.map((key) => ({ key })),
        },
        translations: {
          createMany: { data: translations },
        },
      },
    });
  }
  console.log("✅ Projects seeded");

  // 6. Blog Posts
  const blogsToCreate = [
    {
      slug: "pgvector-ile-semantik-arama",
      status: "published",
      featured: true,
      tags: ["PostgreSQL", "pgvector", "AI", "Vektör Arama"],
      category: "Backend",
      translations: [
        {
          language: Language.tr,
          title: "pgvector ile PostgreSQL'de Semantik Arama",
          description:
            "pgvector eklentisi ile PostgreSQL veritabanında semantik arama ve öneri sistemi nasıl kurulur?",
          content:
            "<h2>pgvector Nedir?</h2><p><strong>pgvector</strong>, PostgreSQL için geliştirilmiş açık kaynaklı bir vektör benzerlik arama eklentisidir. Vektör embedding'leri doğrudan veritabanında saklayıp sorgulamamıza olanak tanır.</p><h2>Neden pgvector?</h2><ul><li>PostgreSQL ile tam entegrasyon</li><li>Harici vektör veritabanı gerektirmez</li><li>HNSW ve IVFFlat indeks desteği</li><li>Kosinüs, Öklid ve iç çarpım mesafe ölçütleri</li></ul><h2>Kurulum</h2><pre><code>CREATE EXTENSION IF NOT EXISTS vector;</code></pre><h2>Tablo Oluşturma</h2><pre><code>CREATE TABLE embeddings (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  content TEXT,\n  embedding vector(768)\n);</code></pre><h2>Benzer İçerik Arama</h2><p>Cosine distance operatörü (<code>&lt;=&gt;</code>) ile en yakın vektörleri bulabilirsiniz.</p>",
          readTime: "7 dk",
          date: "2026-02-20",
          excerpt:
            "pgvector ile PostgreSQL'de vektör arama sistemi kurmak artık çok kolay.",
          metaTitle:
            "pgvector ile Semantik Arama - PostgreSQL Vektör Veritabanı",
          metaDescription:
            "pgvector eklentisi ile PostgreSQL'de semantik arama ve öneri sistemi nasıl kurulur? Adım adım rehber.",
          keywords: [
            "pgvector",
            "postgresql",
            "semantik arama",
            "vektör veritabanı",
            "embedding",
          ],
        },
        {
          language: Language.en,
          title: "Semantic Search in PostgreSQL with pgvector",
          description:
            "How to set up semantic search and recommendation systems in PostgreSQL with the pgvector extension?",
          content:
            "<h2>What is pgvector?</h2><p><strong>pgvector</strong> is an open-source vector similarity search extension for PostgreSQL. It allows us to store and query vector embeddings directly in the database.</p><h2>Why pgvector?</h2><ul><li>Full integration with PostgreSQL</li><li>No external vector database required</li><li>HNSW and IVFFlat index support</li><li>Cosine, Euclidean and inner product distance metrics</li></ul><h2>Installation</h2><pre><code>CREATE EXTENSION IF NOT EXISTS vector;</code></pre><h2>Creating a Table</h2><pre><code>CREATE TABLE embeddings (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  content TEXT,\n  embedding vector(768)\n);</code></pre><h2>Searching Similar Content</h2><p>You can find the nearest vectors using the cosine distance operator (<code>&lt;=&gt;</code>).</p>",
          readTime: "7 min",
          date: "2026-02-20",
          excerpt:
            "Building a vector search system in PostgreSQL with pgvector is now very easy.",
          metaTitle:
            "Semantic Search with pgvector - PostgreSQL Vector Database",
          metaDescription:
            "How to set up semantic search and recommendation systems in PostgreSQL with the pgvector extension? Step-by-step guide.",
          keywords: [
            "pgvector",
            "postgresql",
            "semantic search",
            "vector database",
            "embedding",
          ],
        },
      ],
    },
    {
      slug: "nextjs-server-actions",
      status: "published",
      featured: false,
      tags: ["Next.js", "React", "TypeScript", "Server Actions"],
      category: "Frontend",
      translations: [
        {
          language: Language.tr,
          title: "Next.js 15'te Server Actions ile Form İşleme",
          description:
            "Server Actions kullanarak Next.js'de form işleme, doğrulama ve veritabanı işlemlerini nasıl yapabilirsiniz?",
          content:
            "<h2>Server Actions Nedir?</h2><p>Server Actions, Next.js 14 ile tanıtılan ve form işlemleri ile veri mutasyonlarını doğrudan sunucu tarafında gerçekleştirmenizi sağlayan güçlü bir özelliktir.</p><h2>Temel Kullanım</h2><pre><code>'use server';\n\nexport async function createPost(formData: FormData) {\n  const title = formData.get('title') as string;\n  await db.post.create({ data: { title } });\n  revalidatePath('/posts');\n}</code></pre><h2>Avantajları</h2><ul><li>API route yazmaya gerek yok</li><li>Otomatik revalidation</li><li>Type-safe form işleme</li><li>Progressive enhancement desteği</li></ul>",
          readTime: "5 dk",
          date: "2026-02-10",
          excerpt:
            "Server Actions ile API route yazmadan form işleme ve veri mutasyonu yapabilirsiniz.",
          metaTitle: "Next.js Server Actions ile Form İşleme",
          metaDescription:
            "Next.js Server Actions kullanarak API route yazmadan form işleme ve veritabanı mutasyonları yapın.",
          keywords: ["nextjs", "server actions", "react", "form", "typescript"],
        },
        {
          language: Language.en,
          title: "Form Handling with Next.js 15 Server Actions",
          description:
            "How to handle forms, validation and database operations in Next.js using Server Actions?",
          content:
            "<h2>What are Server Actions?</h2><p>Server Actions are a powerful feature introduced in Next.js 14 that allow you to perform form operations and data mutations directly on the server side.</p><h2>Basic Usage</h2><pre><code>'use server';\n\nexport async function createPost(formData: FormData) {\n  const title = formData.get('title') as string;\n  await db.post.create({ data: { title } });\n  revalidatePath('/posts');\n}</code></pre><h2>Advantages</h2><ul><li>No need to write API routes</li><li>Automatic revalidation</li><li>Type-safe form handling</li><li>Progressive enhancement support</li></ul>",
          readTime: "5 min",
          date: "2026-02-10",
          excerpt:
            "Handle forms and data mutations without writing API routes using Server Actions.",
          metaTitle: "Form Handling with Next.js Server Actions",
          metaDescription:
            "Handle forms and database mutations without writing API routes using Next.js Server Actions.",
          keywords: ["nextjs", "server actions", "react", "form", "typescript"],
        },
      ],
    },
  ];

  for (const blog of blogsToCreate) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: blog.slug },
    });
    if (existing) continue;

    const { translations, ...blogData } = blog;
    await prisma.blogPost.create({
      data: {
        ...blogData,
        translations: {
          createMany: { data: translations },
        },
      },
    });
  }
  console.log("✅ Blog Posts seeded");

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
                  text: "Selam! 👋 Kadir'in projeleri veya teknoloji hakkında soru sormak ister misin?",
                  quickAnswers: [
                    "Hangi teknolojileri kullanıyorsun?",
                    "İletişime geçmek istiyorum.",
                    "Projelerini görmek istiyorum.",
                    "Blog yazılarını okumak istiyorum.",
                  ],
                },
                {
                  language: Language.en,
                  text: "Hi! 👋 Want to ask about Kadir's projects or technology?",
                  quickAnswers: [
                    "What technologies do you use?",
                    "I want to get in touch.",
                    "I want to see your projects.",
                    "I want to read your blog posts.",
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
