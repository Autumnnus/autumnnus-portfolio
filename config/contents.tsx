import {
  BlogPost,
  Language,
  PortfolioConfig,
  Project,
  WorkExperience,
} from "@/types/contents";
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
    date: { tr: "17 Ocak 2026", en: "January 17, 2026" } as Record<
      string,
      string
    >,
    readTime: { tr: "5 dk okuma", en: "5 min read" } as Record<string, string>,
    coverImage: assets.blog.test,
    tags: { tr: ["Kariyer", "Yazılım"], en: ["Career", "Software"] } as Record<
      string,
      string[]
    >,
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
    } as Record<string, any>,
  },
];

const WORK_DATA = [
  {
    company: "Qpien",
    logo: "https://framerusercontent.com/images/Fsa1ndV2XvTCGEdC1yz0u87Qg.png",
    startDate: "2024-02-01",
    endDate: null,
    locationType: { tr: "Hibrit", en: "Hybrid" } as Record<string, string>,
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
    } as Record<string, any>,
  },
];

function getProjects(lang: Language): Project[] {
  return PROJECTS_DATA.map((p) => {
    const images = p.images || [];
    const coverImage = p.coverImage || images[0];
    const trans =
      (p.translations as Record<string, any>)[lang] ||
      p.translations.en ||
      p.translations.tr;

    return {
      ...trans,
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
  return BLOG_DATA.map((b) => {
    const trans =
      b.translations[lang] || b.translations.en || b.translations.tr;
    return {
      ...trans,
      slug: b.slug,
      date: b.date[lang] || b.date.en || b.date.tr,
      readTime: b.readTime[lang] || b.readTime.en || b.readTime.tr,
      coverImage: b.coverImage,
      tags: b.tags[lang] || b.tags.en || b.tags.tr,
      featured: b.featured,
    };
  });
}

function getWorkExperiences(lang: Language): WorkExperience[] {
  return WORK_DATA.map((w) => {
    const trans =
      w.translations[lang] || w.translations.en || w.translations.tr;
    return {
      ...trans,
      company: w.company,
      logo: w.logo,
      startDate: w.startDate,
      endDate: w.endDate,
      locationType:
        w.locationType[lang] || w.locationType.en || w.locationType.tr,
    };
  });
}

const LANGUAGES: Language[] = [
  "tr",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "ar",
  "zh",
];

const getBaseContent = (lang: Language) => {
  const isTr = lang === "tr";
  return {
    navbar: {
      items: isTr
        ? [
            { name: "Ana Sayfa", href: "/" },
            { name: "Projeler", href: "/projects" },
            { name: "Deneyim", href: "/work" },
          ]
        : [
            { name: "Home", href: "/" },
            { name: "Projects", href: "/projects" },
            { name: "Work", href: "/work" },
          ],
    },
    hero: {
      greetingText: isTr ? "Merhaba, ben " : "Hello, I'm ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: assets.common.avatar,
      description: isTr
        ? "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum."
        : "I code like autumn leaves falling. Building web applications and designing user experiences.",
      skills: Object.values(SKILLS),
      buttons: [
        {
          text: isTr ? "Projelerim" : "My Projects",
          href: "#projects",
          variant: "primary" as const,
        },
      ],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: isTr ? "Hakkımda" : "About Me",
      description:
        "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. Uzmanlığım, React, Zustand ve TypeScript ile frontend geliştirmenin yanı sıra Node.js, MongoDB ve Spring Boot ile backend sistemlerini kapsamaktadır.\n Mevcut rolümde, sezgisel kullanıcı arayüzü bileşenlerinden sağlam API servislerine kadar uçtan uca özellikler tasarlıyor ve uyguluyorum. Ayrıca OpenAI embedding'leri ve Pinecone'u entegre ederek daha akıllı arama ve bilgi yönetimi çözümleri sunan yapay zeka destekli modüllere katkıda bulundum.\n Temiz mimari prensipleriyle (SOLID, CQRS, Onion Architecture) çalışmaktan keyif alıyor ve sürekli olarak sürdürülebilir, yüksek kaliteli kod yazmayı hedefliyorum. Teknik becerilerin ötesinde, çevik (agile) ekipler içinde iş birliğine ve etkili problem çözmeye değer veriyorum.\n Şu anda, gelişen teknolojilere dair merakımı korurken, yapay zeka entegrasyonları ve ölçeklenebilir backend sistemleri konusundaki uzmanlığımı geliştiriyorum.",
      experienceLabel: isTr ? "Deneyim" : "Experience",
      projectCount: isTr ? "20+ Proje" : "20+ Projects",
      projectLabel: isTr ? "Proje" : "Projects",
      githubActivityTitle: isTr ? "Kodlama Aktivitesi" : "Coding Activity",
      avatar: assets.common.avatar,
    },
    projects: {
      title: isTr ? "Öne Çıkan Projeler" : "Featured Projects",
      description: isTr
        ? "Farklı teknolojiler ve alanlardaki projelerim ve çalışmalarım."
        : "My projects and work across different technologies and domains.",
      viewAllText: isTr ? "Tümünü Gör" : "View All",
      filterByStatusText: isTr ? "Duruma Göre Filtrele" : "Filter by Status",
      allProjectsText: isTr ? "Tüm Projeler" : "All Projects",
      projectCountText: isTr ? "proje" : "projects",
      noResultsText: isTr
        ? "Bu durumda proje bulunamadı."
        : "No projects found with this status.",
      backToProjectsText: isTr ? "Projelere Dön" : "Back to Projects",
      categoryLabel: isTr ? "Kategori" : "Category",
      statusLabel: isTr ? "Durum" : "Status",
      liveDemoText: isTr ? "Canlı Demo" : "Live Demo",
      sourceCodeText: isTr ? "Kaynak Kod" : "Source Code",
      nextProjectText: isTr ? "Sonraki Proje" : "Next Project",
      relatedProjectsText: isTr ? "İlgili Projeler" : "Related Projects",
      items: getProjects(lang),
    },
    blog: {
      title: isTr ? "Son Yazılar" : "Latest Posts",
      description: isTr
        ? "Mühendislik ve programlama üzerine düşünceler, rehberler ve içgörüler."
        : "Thoughts, tutorials, and insights on engineering, and programming.",
      viewAllText: isTr ? "Tümünü Oku" : "Read All",
      popularTagsText: isTr ? "Popüler Etiketler" : "Popular Tags",
      postCountText: isTr ? "yazı" : "posts",
      noResultsText: isTr ? "Henüz yazı bulunmuyor." : "No posts found.",
      backToBlogText: isTr ? "Bloga Dön" : "Back to Blog",
      commentsTitle: isTr ? "Yorumlar" : "Comments",
      signInToComment: isTr
        ? "Yorum yapmak için giriş yapın"
        : "Sign in to comment",
      joinConversation: isTr
        ? "Google hesabınızla giriş yaparak sohbete katılın"
        : "Join the conversation by signing in with your Google account",
      signInButton: isTr ? "Google ile Giriş Yap" : "Sign in with Google",
      signedInAs: isTr ? "Giriş yapıldı:" : "Signed in as",
      postComment: isTr ? "Yorum Paylaş" : "Post Comment",
      noCommentsYet: isTr
        ? "Henüz yorum yok. İlk yorumu siz yapın!"
        : "No comments yet. Be the first to comment!",
      items: getBlogPosts(lang),
    },
    work: {
      title: isTr ? "Deneyimler" : "Experience",
      description: isTr
        ? "Farklı şirketler ve rollerdeki iş deneyimlerim."
        : "My work experiences across different companies and roles.",
      allExperiencesText: isTr ? "Tüm Deneyimler" : "All Experiences",
      experienceCountText: isTr ? "deneyim" : "experiences",
      items: getWorkExperiences(lang),
    },
    footer: {
      text: isTr
        ? "© 2026 Kadir. Tüm hakları saklıdır."
        : "© 2026 Kadir. All rights reserved.",
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.LINKEDIN],
    },
  };
};

export const portfolioContent: PortfolioConfig = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang] = getBaseContent(lang);
    return acc;
  },
  {} as PortfolioConfig,
);
