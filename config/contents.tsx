import { Language, PortfolioConfig, WorkExperience } from "@/types/contents";
import { assets } from "../assets";

import { PROJECTS_BASE_DATA, SKILLS, SOCIAL_LINKS } from "./data";
export { SKILLS, SOCIAL_LINKS };

// Map assets to project slugs
const PROJECT_ASSETS: Record<string, { images?: any[]; coverImage?: any }> = {
  "my-games": { images: assets.projects.myGames },
  "star-wars-apollo": { images: assets.projects.starWarsApollo },
  "js-methods": { images: assets.projects.javascriptMethods },
  "my-games-old": {
    images: assets.projects.myGamesLegacy,
    coverImage: assets.projects.myGamesLegacy[1],
  },
  "whatsapp-clone": {
    images: assets.projects.whatsappClone,
    coverImage: assets.projects.whatsappClone[1],
  },
  "flight-app": { images: assets.projects.flightApp },
  "movie-app": { images: assets.projects.movieApp },
  "product-app": { images: assets.projects.productApp },
  "e-commerce-frontend": { images: assets.projects.ecommerce },
  calculator: { images: assets.projects.calculator },
  "github-user-info": { images: assets.projects.githubUserInfo },
  "currency-converter": { images: assets.projects.currencyConverter },
  "music-player": { images: assets.projects.musicPlayer },
  "country-info": { images: assets.projects.countryInfo },
  "weather-app": { images: assets.projects.weatherApp },
  "color-flipper": { images: assets.projects.colorFlipper },
  "quiz-website": { images: assets.projects.quizApp },
};

export const PROJECTS_DATA = PROJECTS_BASE_DATA.map((project) => ({
  ...project,
  ...PROJECT_ASSETS[project.slug],
}));

const BLOG_DATA = [
  {
    slug: "hello-world",
    date: { tr: "17 Ocak 2026", en: "January 17, 2026" },
    readTime: { tr: "5 dk okuma", en: "5 min read" },
    coverImage: assets.blog.test,
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
    company: "Qpien",
    logo: "https://framerusercontent.com/images/Fsa1ndV2XvTCGEdC1yz0u87Qg.png",
    startDate: "2024-02-01",
    endDate: null,
    locationType: { tr: "Hibrit", en: "Hybrid" },
    translations: {
      tr: {
        role: "Full Stack Developer",
        description: `
- React, Zustand ve React Hook Form kullanarak kullanıcı dostu arayüzler geliştirdim.
- Node.js ve MongoDB ile ölçeklenebilir backend API’leri oluşturdum.
- OpenAI, Embeddings ve Pinecone kullanarak RAG kontrollü bir AI modülünün temelini ve geliştirilmesini destekledim.
- Clean Code, SOLID ve katmanlı mimari prensiplerini (Onion Architecture, CQRS) uyguladım.
- Ekip içi iş birliği için Jira, Bitbucket ve GraphQL gibi araçları etkin şekilde kullandım.
        `,
      },
      en: {
        role: "Full Stack Developer",
        description: `
- Built user-friendly frontend interfaces using React, Zustand, and React Hook Form.
- Developed scalable backend APIs with Node.js and MongoDB.
- Contributed to the foundation and development of an AI module powered by RAG using OpenAI, Embeddings, and Pinecone.
- Applied Clean Code, SOLID, and layered architecture principles (Onion Architecture, CQRS).
- Effectively collaborated using tools such as Jira, Bitbucket, and GraphQL.
        `,
      },
    },
  },
];

function getProjects(lang: Language): Project[] {
  return PROJECTS_DATA.map((p) => {
    const images = p.images || [];
    const coverImage = p.coverImage || images[0];

    return {
      ...p.translations[lang],
      slug: p.slug,
      images: images,
      coverImage: coverImage,
      technologies: p.technologies,
      status: p.status,
      category: p.category,
      github: p.github,
      liveDemo: p.liveDemo,
      featured: p.featured,
    } as Project;
  });
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
    startDate: w.startDate,
    endDate: w.endDate,
    locationType: w.locationType[lang],
  }));
}

export const portfolioContent: PortfolioConfig = {
  tr: {
    navbar: {
      items: [
        { name: "Ana Sayfa", href: "/" },
        { name: "Projeler", href: "/projects" },
        // { name: "Blog", href: "/blog" },
        { name: "Deneyim", href: "/work" },
      ],
    },
    hero: {
      greetingText: "Merhaba, ben ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: assets.common.avatar,
      description:
        "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum.",
      skills: Object.values(SKILLS),
      buttons: [{ text: "Projelerim", href: "#projects", variant: "primary" }],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: "Hakkımda",
      description:
        "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. Uzmanlığım, React, Zustand ve TypeScript ile frontend geliştirmenin yanı sıra Node.js, MongoDB ve Spring Boot ile backend sistemlerini kapsamaktadır.\n Mevcut rolümde, sezgisel kullanıcı arayüzü bileşenlerinden sağlam API servislerine kadar uçtan uca özellikler tasarlıyor ve uyguluyorum. Ayrıca OpenAI embedding'leri ve Pinecone'u entegre ederek daha akıllı arama ve bilgi yönetimi çözümleri sunan yapay zeka destekli modüllere katkıda bulundum.\n Temiz mimari prensipleriyle (SOLID, CQRS, Onion Architecture) çalışmaktan keyif alıyor ve sürekli olarak sürdürülebilir, yüksek kaliteli kod yazmayı hedefliyorum. Teknik becerilerin ötesinde, çevik (agile) ekipler içinde iş birliğine ve etkili problem çözmeye değer veriyorum.\n Şu anda, gelişen teknolojilere dair merakımı korurken, yapay zeka entegrasyonları ve ölçeklenebilir backend sistemleri konusundaki uzmanlığımı geliştiriyorum.",
      experienceLabel: "Deneyim",
      projectCount: "20+ Proje",
      projectLabel: "Proje",
      githubActivityTitle: "Kodlama Aktivitesi",
      avatar: assets.common.avatar,
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
      categoryLabel: "Kategori",
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
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.LINKEDIN],
    },
  },
  en: {
    navbar: {
      items: [
        { name: "Home", href: "/" },
        { name: "Projects", href: "/projects" },
        // { name: "Blog", href: "/blog" },
        { name: "Work", href: "/work" },
      ],
    },
    hero: {
      greetingText: "Hello, I'm ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: assets.common.avatar,
      description:
        "I code like autumn leaves falling. Building web applications and designing user experiences.",
      skills: Object.values(SKILLS),
      buttons: [{ text: "My Projects", href: "#projects", variant: "primary" }],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: "About Me",
      description:
        "I’m a Full-Stack Developer passionate about building scalable, user-centric applications. My expertise spans frontend development with React, Zustand, and TypeScript, as well as backend systems with Node.js, MongoDB, and Spring Boot.\n At my current role, I design and implement end-to-end features — from intuitive UI components to robust API services. I’ve also contributed to AI-powered modules by integrating OpenAI embeddings and Pinecone, enabling smarter search and knowledge management solutions.\n I enjoy working with clean architecture principles (SOLID, CQRS, Onion Architecture) and continuously seek to write maintainable, high-quality code. Beyond technical skills, I value collaboration and effective problem-solving within agile teams.\n Currently, I’m expanding my expertise in AI integrations and scalable backend systems while staying curious about emerging technologies.",
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
      categoryLabel: "Category",
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
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.LINKEDIN],
    },
  },
};
