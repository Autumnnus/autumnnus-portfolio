import {
  BlogPost,
  Language,
  PortfolioConfig,
  Project,
  WorkExperience,
} from "@/types/contents";

const SKILLS = {
  TYPESCRIPT: {
    name: "TypeScript",
    icon: "https://cdn.simpleicons.org/typescript/3178C6",
  },
  REACT: { name: "React", icon: "https://cdn.simpleicons.org/react/61DAFB" },
  NEXTJS: {
    name: "Next.js",
    icon: "https://cdn.simpleicons.org/nextdotjs/000000",
  },
  NODEJS: {
    name: "Node.js",
    icon: "https://cdn.simpleicons.org/nodedotjs/339933",
  },
  POSTGRES: {
    name: "PostgreSQL",
    icon: "https://cdn.simpleicons.org/postgresql/4169E1",
  },
  TAILWIND: {
    name: "Tailwind CSS",
    icon: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
  },
};

const SOCIAL_LINKS = {
  GITHUB: {
    name: "GitHub",
    href: "https://github.com",
    icon: "https://cdn.simpleicons.org/github/181717",
  },
  LINKEDIN: {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
  },
  TWITTER: {
    name: "Twitter",
    href: "https://twitter.com",
    icon: "https://cdn.simpleicons.org/x/000000",
  },
  EMAIL: {
    name: "Email",
    href: "mailto:hello@example.com",
    icon: "https://cdn.simpleicons.org/gmail/EA4335",
  },
};

const PROJECTS_DATA = [
  {
    slug: "notesbuddy",
    coverImage: "/projects/notesbuddy.jpg",
    technologies: [SKILLS.NEXTJS, SKILLS.TYPESCRIPT, SKILLS.TAILWIND],
    status: "Completed" as const,
    github: "https://github.com/example/notesbuddy",
    liveDemo: "https://notesbuddy.example.com",
    featured: true,
    translations: {
      tr: {
        title: "NotesBuddy",
        shortDescription:
          "Notlar, bilgi kartları ve yapay zeka destekli kapsamlı bir çalışma platformu",
        fullDescription:
          "Kullanıcıların not okuyabileceği, test çözebileceği, bilgi kartlarından tekrar yapabileceği ve kod parçacıklarını çalıştırabileceği bir not paylaşım platformu.",
        timeline: "2 ay",
        role: "Full Stack",
        team: "Solo",
      },
      en: {
        title: "NotesBuddy",
        shortDescription:
          "A comprehensive study platform with notes, flashcards, and AI support",
        fullDescription:
          "A Notes Sharing Platform where users can read notes, give quizzes, revise from flashcards, execute code snippets, and also have PYQs, more.",
        timeline: "2 months",
        role: "Full Stack",
        team: "Solo",
      },
    },
  },
  {
    slug: "festx",
    coverImage: "/projects/festx.jpg",
    technologies: [SKILLS.NEXTJS, SKILLS.TYPESCRIPT, SKILLS.POSTGRES],
    status: "Completed" as const,
    github: "https://github.com/example/festx",
    liveDemo: "https://festx.example.com",
    featured: true,
    translations: {
      tr: {
        title: "FestX - Etkinlik Yönetim Platformu",
        shortDescription:
          "Üniversite festivalleri ve hackathonlar için kapsamlı etkinlik yönetim platformu",
        fullDescription:
          "Üniversite festivalleri ve hackathonların sorunsuz organizasyonu ve katılımcı deneyimi için oluşturulmuş kapsamlı bir etkinlik yönetim platformu",
        timeline: "3 ay",
        role: "Full Stack Lider",
        team: "4 Kişilik Ekip",
      },
      en: {
        title: "FestX - Event Management Platform",
        shortDescription:
          "A comprehensive event management platform for college festivals and hackathons",
        fullDescription:
          "A comprehensive event management platform for college festivals and hackathons, built for seamless organization and participant experience",
        timeline: "3 months",
        role: "Full Stack Lead",
        team: "Team of 4",
      },
    },
  },
];

const BLOG_DATA = [
  {
    slug: "hello-world",
    date: { tr: "17 Ocak 2026", en: "January 17, 2026" },
    readTime: { tr: "5 dk okuma", en: "5 min read" },
    coverImage: "/blog/hello.jpg",
    tags: { tr: ["Kariyer", "Yazılım"], en: ["Career", "Software"] },
    featured: true,
    translations: {
      tr: {
        title: "Merhaba Dünya: Yazılım Yolculuğum",
        description: "Yazılım dünyasına nasıl adım attım ve neler öğrendim?",
        content: `
## Yazılım Dünyasına Giriş
Yazılım dünyasına attığım ilk adım, her zaman olduğu gibi o meşhur satırla başladı. Karmaşık görünen kodların arkasındaki mantığı anlamak başlangıçta zordu ama bir o kadar da heyecan vericiydi.

## İlk Kodum
İşte her şeyin başladığı o an:

\`\`\`javascript
const greeting = "Merhaba Dünya!";
console.log(greeting);

function startJourney() {
  console.log("Kodlamaya başlıyorum... 🚀");
}

startJourney();
\`\`\`

## Neler Öğrendim?
Bu yolculukta sadece sözdizimi öğrenmedim, aynı zamanda problem çözme sanatını ve sabırlı olmayı da öğrendim.
`,
      },
      en: {
        title: "Hello World: My Software Journey",
        description:
          "How I stepped into the world of software and what I learned.",
        content: `
## Entering the Software World
My first step into the world of software started with that famous line, as always. Understanding the logic behind complex-looking code was difficult at first, but equally exciting.

## My First Code
The moment it all started:

\`\`\`javascript
const greeting = "Hello World!";
console.log(greeting);

function startJourney() {
  console.log("Starting my coding journey... 🚀");
}

startJourney();
\`\`\`

## What I Learned?
On this journey, I didn't just learn syntax; I also learned the art of problem-solving and how to be patient.
`,
      },
    },
  },
];

const WORK_DATA = [
  {
    company: "Tech Solutions",
    logo: "https://cdn.simpleicons.org/vercel/000000",
    period: { tr: "2024 - Günümüz", en: "2024 - Present" },
    translations: {
      tr: {
        role: "Frontend Developer",
        description:
          "Modern web uygulamaları geliştirme ve kullanıcı arayüzü optimizasyonu.",
      },
      en: {
        role: "Frontend Developer",
        description:
          "Developing modern web applications and optimizing user interfaces.",
      },
    },
  },
];

// --- Helper functions to assemble content ---

function getProjects(lang: Language): Project[] {
  return PROJECTS_DATA.map((p) => ({
    ...p.translations[lang],
    slug: p.slug,
    coverImage: p.coverImage,
    technologies: p.technologies,
    status: p.status,
    github: p.github,
    liveDemo: p.liveDemo,
    featured: p.featured,
  }));
}

function getBlogPosts(lang: Language): BlogPost[] {
  return BLOG_DATA.map((b) => ({
    ...b.translations[lang],
    slug: b.slug,
    date: b.date[lang],
    readTime: b.readTime[lang],
    coverImage: b.coverImage,
    tags: b.tags[lang],
    featured: b.featured,
  }));
}

function getWorkExperiences(lang: Language): WorkExperience[] {
  return WORK_DATA.map((w) => ({
    ...w.translations[lang],
    company: w.company,
    logo: w.logo,
    period: w.period[lang],
  }));
}

export const portfolioContent: PortfolioConfig = {
  tr: {
    navbar: {
      items: [
        { name: "Ana Sayfa", href: "/" },
        { name: "Projeler", href: "/projects" },
        { name: "Blog", href: "/blog" },
        { name: "Deneyim", href: "/work" },
      ],
    },
    hero: {
      greetingText: "Merhaba, ben ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: "/avatar.png",
      description:
        "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum.",
      skills: Object.values(SKILLS),
      buttons: [{ text: "Projelerim", href: "#projects", variant: "primary" }],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: "Hakkımda",
      description:
        "Merhaba! Ben Kadir. Teknolojiye olan tutkumla modern ve kullanıcı dostu web uygulamaları geliştiriyorum. Yeni şeyler öğrenmeyi ve karmaşık problemleri çözmeyi seviyorum.",
      experienceCount: "3+ Yıl",
      experienceLabel: "Deneyim",
      projectCount: "20+ Proje",
      projectLabel: "Proje",
      githubActivityTitle: "Kodlama Aktivitesi",
      avatar: "/avatar.png",
    },
    projects: {
      title: "Öne Çıkan Projeler",
      description:
        "Farklı teknolojiler ve alanlardaki projelerim ve çalışmalarım.",
      viewAllText: "Tümünü Gör",
      filterByStatusText: "Duruma Göre Filtrele",
      allProjectsText: "Tüm Projeler",
      projectCountText: "proje",
      noResultsText: "Bu durumda proje bulunamadı.",
      backToProjectsText: "Projelere Dön",
      timelineLabel: "Süreç",
      roleLabel: "Rol",
      statusLabel: "Durum",
      liveDemoText: "Canlı Demo",
      sourceCodeText: "Kaynak Kod",
      nextProjectText: "Sonraki Proje",
      relatedProjectsText: "İlgili Projeler",
      items: getProjects("tr"),
    },
    blog: {
      title: "Son Yazılar",
      description:
        "Mühendislik ve programlama üzerine düşünceler, rehberler ve içgörüler.",
      viewAllText: "Tümünü Oku",
      popularTagsText: "Popüler Etiketler",
      postCountText: "yazı",
      noResultsText: "Henüz yazı bulunmuyor.",
      backToBlogText: "Bloga Dön",
      commentsTitle: "Yorumlar",
      signInToComment: "Yorum yapmak için giriş yapın",
      joinConversation: "Google hesabınızla giriş yaparak sohbete katılın",
      signInButton: "Google ile Giriş Yap",
      signedInAs: "Giriş yapıldı:",
      postComment: "Yorum Paylaş",
      noCommentsYet: "Henüz yorum yok. İlk yorumu siz yapın!",
      items: getBlogPosts("tr"),
    },
    work: {
      title: "Deneyimler",
      description: "Farklı şirketler ve rollerdeki iş deneyimlerim.",
      allExperiencesText: "Tüm Deneyimler",
      experienceCountText: "deneyim",
      items: getWorkExperiences("tr"),
    },
    footer: {
      text: "© 2026 Kadir. Tüm hakları saklıdır.",
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.TWITTER],
    },
  },
  en: {
    navbar: {
      items: [
        { name: "Home", href: "/" },
        { name: "Projects", href: "/projects" },
        { name: "Blog", href: "/blog" },
        { name: "Work", href: "/work" },
      ],
    },
    hero: {
      greetingText: "Hello, I'm ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: "/avatar.png",
      description:
        "I code like autumn leaves falling. Building web applications and designing user experiences.",
      skills: Object.values(SKILLS),
      buttons: [{ text: "My Projects", href: "#projects", variant: "primary" }],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: "About Me",
      description:
        "Hello! I'm Kadir. I develop modern and user-friendly web applications with my passion for technology. I love learning new things and solving complex problems.",
      experienceCount: "3+ Years",
      experienceLabel: "Experience",
      projectCount: "20+ Projects",
      projectLabel: "Projects",
      githubActivityTitle: "Coding Activity",
      avatar: "/avatar.png",
    },
    projects: {
      title: "Featured Projects",
      description:
        "My projects and work across different technologies and domains.",
      viewAllText: "View All",
      filterByStatusText: "Filter by Status",
      allProjectsText: "All Projects",
      projectCountText: "projects",
      noResultsText: "No projects found with this status.",
      backToProjectsText: "Back to Projects",
      timelineLabel: "Timeline",
      roleLabel: "Role",
      statusLabel: "Status",
      liveDemoText: "Live Demo",
      sourceCodeText: "Source Code",
      nextProjectText: "Next Project",
      relatedProjectsText: "Related Projects",
      items: getProjects("en"),
    },
    blog: {
      title: "Latest Posts",
      description:
        "Thoughts, tutorials, and insights on engineering, and programming.",
      viewAllText: "Read All",
      popularTagsText: "Popular Tags",
      postCountText: "posts",
      noResultsText: "No posts found.",
      backToBlogText: "Back to Blog",
      commentsTitle: "Comments",
      signInToComment: "Sign in to comment",
      joinConversation:
        "Join the conversation by signing in with your Google account",
      signInButton: "Sign in with Google",
      signedInAs: "Signed in as",
      postComment: "Post Comment",
      noCommentsYet: "No comments yet. Be the first to comment!",
      items: getBlogPosts("en"),
    },
    work: {
      title: "Experience",
      description: "My work experiences across different companies and roles.",
      allExperiencesText: "All Experiences",
      experienceCountText: "experiences",
      items: getWorkExperiences("en"),
    },
    footer: {
      text: "© 2026 Kadir. All rights reserved.",
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.TWITTER],
    },
  },
};
