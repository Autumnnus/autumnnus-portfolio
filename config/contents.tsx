import {
  BlogPost,
  Language,
  PortfolioConfig,
  Project,
  WorkExperience,
} from "@/types/contents";
import { assets } from "../assets";

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
  JAVA: {
    name: "Java",
    icon: "https://cdn.simpleicons.org/openjdk/000000",
  },
  SPRING_BOOT: {
    name: "Spring Boot",
    icon: "https://cdn.simpleicons.org/springboot/6DB33F",
  },
  MONGODB: {
    name: "MongoDB",
    icon: "https://cdn.simpleicons.org/mongodb/47A248",
  },
  EXPRESS: {
    name: "Express.js",
    icon: "https://cdn.simpleicons.org/express/000000",
  },
  AWS: {
    name: "AWS",
    icon: "https://cdn.simpleicons.org/amazonaws/232F3E",
  },
  REDUX: {
    name: "Redux",
    icon: "https://cdn.simpleicons.org/redux/764ABC",
  },
  GRAPHQL: {
    name: "GraphQL",
    icon: "https://cdn.simpleicons.org/graphql/E10098",
  },
  FIREBASE: {
    name: "Firebase",
    icon: "https://cdn.simpleicons.org/firebase/FFCA28",
  },
  JAVASCRIPT: {
    name: "JavaScript",
    icon: "https://cdn.simpleicons.org/javascript/F7DF1E",
  },
  MATERIAL_UI: {
    name: "Material UI",
    icon: "https://cdn.simpleicons.org/mui/007FFF",
  },
};

const SOCIAL_LINKS = {
  GITHUB: {
    name: "GitHub",
    href: "https://github.com/Autumnnus",
    icon: "https://cdn.simpleicons.org/github/181717",
  },
  LINKEDIN: {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/kadir-topcu/",
    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
  },
  EMAIL: {
    name: "Email",
    href: "mailto:akadir.38@gmail.com",
    icon: "https://cdn.simpleicons.org/gmail/EA4335",
  },
};

export const PROJECTS_DATA = [
  // Backend Projects
  {
    slug: "e-commerce-api",
    coverImage: assets.projects.test[0],
    images: assets.projects.test,
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed" as const,
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
          "Spring Boot ve PostgreSQL kullanılarak geliştirilmiş, kapsamlı bir E-Ticaret REST API'si.",
      },
      en: {
        title: "E-Commerce API",
        shortDescription: "E-Commerce API built with Spring Boot",
        fullDescription:
          "A comprehensive E-Commerce REST API developed using Spring Boot and PostgreSQL.",
      },
    },
  },
  {
    slug: "gallerist",
    images: assets.projects.test,
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed" as const,
    category: "Backend",
    github: "https://github.com/Autumnnus/gallerist",
    featured: false,
    translations: {
      tr: {
        title: "Gallerist",
        shortDescription: "Spring Boot ile galeri yönetim uygulaması",
        fullDescription:
          "Spring Boot altyapısıyla geliştirilmiş, galeri ve sanat eseri yönetim sistemi.",
      },
      en: {
        title: "Gallerist",
        shortDescription: "Gallery management application with Spring Boot",
        fullDescription:
          "Gallery and artwork management system developed with Spring Boot infrastructure.",
      },
    },
  },
  {
    slug: "spring-boot-tutorials",
    images: assets.projects.test,
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed" as const,
    category: "Backend",
    github: "https://github.com/Autumnnus/spring-boot-tutorials",
    featured: false,
    translations: {
      tr: {
        title: "Spring Boot Tutorials",
        shortDescription: "Kapsamlı Spring Boot eğitim projeleri",
        fullDescription:
          "Spring Boot öğrenimi için hazırlanmış çoklu örnek projeler ve eğitim materyalleri.",
      },
      en: {
        title: "Spring Boot Tutorials",
        shortDescription: "Comprehensive Spring Boot tutorial projects",
        fullDescription:
          "Multiple sample projects and educational materials prepared for learning Spring Boot.",
      },
    },
  },
  {
    slug: "my-games-backend",
    images: assets.projects.test,
    technologies: [
      SKILLS.TYPESCRIPT,
      SKILLS.EXPRESS,
      SKILLS.MONGODB,
      SKILLS.AWS,
    ],
    status: "Completed" as const,
    category: "Backend",
    github: "https://github.com/Autumnnus/my-games-backend",
    featured: false,
    translations: {
      tr: {
        title: "My Games Backend",
        shortDescription: "Oyun veritabanı için backend servisi",
        fullDescription:
          "MongoDB ve AWS servisleri kullanılarak geliştirilmiş, oyun verilerini yöneten ölçeklenebilir backend servisi.",
      },
      en: {
        title: "My Games Backend",
        shortDescription: "Backend service for game database",
        fullDescription:
          "Scalable backend service managing game data, developed using MongoDB and AWS services.",
      },
    },
  },
  {
    slug: "qa-rest-api",
    images: assets.projects.test,
    technologies: [SKILLS.JAVASCRIPT, SKILLS.EXPRESS, SKILLS.MONGODB],
    status: "Completed" as const,
    category: "Backend",
    github: "https://github.com/Autumnnus/Question-Answer-Rest-Api",
    featured: false,
    translations: {
      tr: {
        title: "Q&A REST API",
        shortDescription: "Soru-Cevap platformu için REST API",
        fullDescription:
          "Express.js ve MongoDB kullanılarak oluşturulmuş basit ve etkili bir soru-cevap servisi.",
      },
      en: {
        title: "Q&A REST API",
        shortDescription: "REST API for Q&A platform",
        fullDescription:
          "Simple and effective Q&A service built using Express.js and MongoDB.",
      },
    },
  },

  // Frontend Projects
  {
    slug: "my-games",
    images: assets.projects.myGames,
    technologies: [SKILLS.REACT, SKILLS.TYPESCRIPT, SKILLS.MATERIAL_UI],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/my-games",
    liveDemo: "https://my-games.netlify.app/",
    featured: true,
    translations: {
      tr: {
        title: "My Games",
        shortDescription: "Oyun koleksiyonu yönetim platformu",
        fullDescription:
          "Oyuncuların oyun verilerini saklayabileceği ve yönetebileceği, React ile geliştirilmiş (Refactored) web uygulaması.",
      },
      en: {
        title: "My Games",
        shortDescription: "Game collection management platform",
        fullDescription:
          "Web application developed with React (Refactored) where players can store and manage their game data.",
      },
    },
  },
  {
    slug: "star-wars-apollo",
    images: assets.projects.starWarsApollo,
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.GRAPHQL,
    ],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/starwars-apollo-graphql",
    liveDemo: "https://starwars-apollo-graphql.netlify.app/",
    featured: true,
    translations: {
      tr: {
        title: "Star Wars Apollo",
        shortDescription: "GraphQL ile Star Wars evreni",
        fullDescription:
          "Apollo Client ve GraphQL kullanılarak geliştirilmiş, Star Wars verilerini görselleştiren React projesi.",
      },
      en: {
        title: "Star Wars Apollo",
        shortDescription: "Star Wars universe with GraphQL",
        fullDescription:
          "React project visualizing Star Wars data, developed using Apollo Client and GraphQL.",
      },
    },
  },
  {
    slug: "js-methods",
    images: assets.projects.javascriptMethods,
    technologies: [SKILLS.REACT, SKILLS.TYPESCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/Javascript-Methods",
    liveDemo: "https://javascriptmethods.netlify.app",
    featured: false,
    translations: {
      tr: {
        title: "JS Methods",
        shortDescription: "JavaScript metotları rehberi",
        fullDescription:
          "JavaScript metotlarının pratik kullanımlarını gösteren eğitici web uygulaması.",
      },
      en: {
        title: "JS Methods",
        shortDescription: "Guide to JavaScript methods",
        fullDescription:
          "Educational web application demonstrating practical uses of JavaScript methods.",
      },
    },
  },
  {
    slug: "my-games-old",
    images: assets.projects.myGamesLegacy,
    technologies: [
      SKILLS.REACT,
      SKILLS.JAVASCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Archived" as const,
    category: "Frontend",
    coverImage: assets.projects.myGamesLegacy[1],
    github: "https://github.com/Autumnnus/my-games-old",
    liveDemo: "https://my-games-OLD.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "My Games (Legacy)",
        shortDescription: "Oyun koleksiyonu uygulamasının ilk sürümü",
        fullDescription:
          "Oyun verilerini saklamak için geliştirilmiş uygulamanın ilk versiyonu (Artık geliştirilmiyor).",
      },
      en: {
        title: "My Games (Legacy)",
        shortDescription: "First version of the game collection app",
        fullDescription:
          "The first version of the application developed to store game data (Abandoned).",
      },
    },
  },
  {
    slug: "whatsapp-clone",
    images: assets.projects.whatsappClone,
    coverImage: assets.projects.whatsappClone[1],
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/Whatsapp-Clone---React",
    liveDemo: "https://wpclone-by-vector.netlify.app/",
    featured: true,
    translations: {
      tr: {
        title: "WhatsApp Clone",
        shortDescription: "Firebase tabanlı mesajlaşma uygulaması",
        fullDescription:
          "Firebase servisleri kullanılarak geliştirilmiş, gerçek zamanlı mesajlaşma özellikli WhatsApp kopyası (Beta).",
      },
      en: {
        title: "WhatsApp Clone",
        shortDescription: "Firebase-based messaging application",
        fullDescription:
          "WhatsApp clone with real-time messaging features developed using Firebase services (Beta).",
      },
    },
  },
  {
    slug: "flight-app",
    images: assets.projects.flightApp,
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/Flight-app",
    liveDemo: "https://flight-app-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Flight App",
        shortDescription: "Uçuş arama ve listeleme uygulaması",
        fullDescription:
          "React ve TypeScript ile geliştirilmiş, uçuş bilgilerini listeleyen uygulama.",
      },
      en: {
        title: "Flight App",
        shortDescription: "Flight search and listing application",
        fullDescription:
          "Application listing flight information, developed with React and TypeScript.",
      },
    },
  },
  {
    slug: "movie-app",
    images: assets.projects.movieApp,
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/Movie-App-React-Redux",
    liveDemo: "https://movie-app-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Movie App",
        shortDescription: "Film veri tabanı ve yönetimi",
        fullDescription:
          "JSON server üzerinden film bilgilerini dinamik olarak düzenleyen ve listeleyen uygulama.",
      },
      en: {
        title: "Movie App",
        shortDescription: "Movie database and management",
        fullDescription:
          "Application dynamically editing and listing movie information via JSON server.",
      },
    },
  },
  {
    slug: "product-app",
    images: assets.projects.productApp,
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/Product-App",
    liveDemo: "https://product-app-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Product App",
        shortDescription: "Ürün yönetim uygulaması",
        fullDescription:
          "TODO uygulamasına benzer yapıda, ürün ekleme, düzenleme ve silme işlemlerini yöneten uygulama.",
      },
      en: {
        title: "Product App",
        shortDescription: "Product management application",
        fullDescription:
          "Application managing product addition, editing and deletion, similar to TODO app structure.",
      },
    },
  },
  {
    slug: "e-commerce-frontend",
    images: assets.projects.ecommerce,
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
    category: "Frontend",
    github: "https://github.com/Autumnnus/E-Commerce-React-Redux-",
    liveDemo: "https://e-commerce-vector-shop.netlify.app/",
    featured: true,
    translations: {
      tr: {
        title: "E-Commerce Frontend",
        shortDescription: "Fakestore API ile alışveriş sitesi",
        fullDescription:
          "Fakestore API kullanarak ürün listeleme ve sepet işlemlerini simüle eden e-ticaret arayüzü.",
      },
      en: {
        title: "E-Commerce Frontend",
        shortDescription: "Shopping site with Fakestore API",
        fullDescription:
          "E-commerce interface simulating product listing and cart operations using Fakestore API.",
      },
    },
  },

  // JavaScript Projects
  {
    slug: "calculator",
    images: assets.projects.calculator,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Calculator",
    liveDemo: "https://calculator-project-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Calculator",
        shortDescription: "Kapsamlı hesap makinesi",
        fullDescription:
          "Birçok fonksiyonu barındıran detaylı JavaScript hesap makinesi uygulaması.",
      },
      en: {
        title: "Calculator",
        shortDescription: "Comprehensive calculator",
        fullDescription:
          "Detailed JavaScript calculator application containing many functions.",
      },
    },
  },
  {
    slug: "fast-localization",
    images: assets.projects.test,
    technologies: [SKILLS.NODEJS],
    status: "Completed" as const,
    category: "Tool",
    github: "https://github.com/Autumnnus/Fast-Localization-Placement",
    featured: false,
    translations: {
      tr: {
        title: "Fast Loc. Placement",
        shortDescription: "PDX oyunları için yerelleştirme aracı",
        fullDescription:
          "PDX oyunları için yerelleştirme dosyalarını hızlıca yerleştiren Node.js tabanlı araç.",
      },
      en: {
        title: "Fast Loc. Placement",
        shortDescription: "Localization tool for PDX games",
        fullDescription:
          "Node.js based tool that quickly places localization files for PDX games.",
      },
    },
  },
  {
    slug: "pdx-modifier",
    images: assets.projects.test,
    technologies: [SKILLS.NODEJS],
    status: "Completed" as const,
    category: "Tool",
    github: "https://github.com/Autumnnus/PDX-Modifier-Multiplier-Program",
    featured: false,
    translations: {
      tr: {
        title: "Modifier Multiplier",
        shortDescription: "Oyun modlayıcıları için araç",
        fullDescription:
          "PDX oyunları için modifier değerlerini çarpan Node.js programı.",
      },
      en: {
        title: "Modifier Multiplier",
        shortDescription: "Tool for game modders",
        fullDescription:
          "Node.js program that multiplies modifier values for PDX games.",
      },
    },
  },
  {
    slug: "github-user-info",
    images: assets.projects.githubUserInfo,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Github-User-Information",
    liveDemo: "https://github-fetch-user-info-demo.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Github User Info",
        shortDescription: "Github kullanıcı bilgileri görüntüleyici",
        fullDescription:
          "Github kullanıcı bilgilerini API üzerinden çeken ve görüntüleyen uygulama.",
      },
      en: {
        title: "Github User Info",
        shortDescription: "Github user information viewer",
        fullDescription:
          "Application that fetches and displays Github user information via API.",
      },
    },
  },
  {
    slug: "currency-converter",
    images: assets.projects.currencyConverter,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Currency-Converter",
    liveDemo: "https://currency-project-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Currency Converter",
        shortDescription: "Döviz kur çevirici",
        fullDescription:
          "Dünya genelindeki para birimlerini birbirine çeviren döviz sitesi.",
      },
      en: {
        title: "Currency Converter",
        shortDescription: "Currency exchange converter",
        fullDescription:
          "Foreign exchange site that converts currencies worldwide.",
      },
    },
  },
  {
    slug: "music-player",
    images: assets.projects.musicPlayer,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Music-Player",
    liveDemo: "https://music-player-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Music Player",
        shortDescription: "Basit müzik çalar",
        fullDescription:
          "Temel özelliklere sahip, web tabanlı müzik çalar uygulaması.",
      },
      en: {
        title: "Music Player",
        shortDescription: "Basic music player",
        fullDescription:
          "Web based music player application with basic features.",
      },
    },
  },
  {
    slug: "country-info",
    images: assets.projects.countryInfo,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Country-Info",
    liveDemo: "https:/country-info-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Country Info",
        shortDescription: "Ülke bilgileri rehberi",
        fullDescription:
          "API kullanarak ülkeler hakkında bilgi sağlayan web uygulaması.",
      },
      en: {
        title: "Country Info",
        shortDescription: "Country information guide",
        fullDescription:
          "Web application providing information about countries using API.",
      },
    },
  },
  {
    slug: "weather-app",
    images: assets.projects.weatherApp,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Weather-App",
    liveDemo: "https://weather-app-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Weather App",
        shortDescription: "Hava durumu uygulaması",
        fullDescription:
          "API servisi kullanarak hava durumu bilgilerini gösteren uygulama.",
      },
      en: {
        title: "Weather App",
        shortDescription: "Weather forecast application",
        fullDescription:
          "Application showing weather information using API service.",
      },
    },
  },
  {
    slug: "color-flipper",
    images: assets.projects.colorFlipper,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Color-Flipper",
    liveDemo: "https://color-flipper-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Color Flipper",
        shortDescription: "Rastgele renk üretici",
        fullDescription:
          "Rastgele renk kodları üreten ve arkaplanı değiştiren araç.",
      },
      en: {
        title: "Color Flipper",
        shortDescription: "Random color generator",
        fullDescription:
          "Tool generating random color codes and changing the background.",
      },
    },
  },
  {
    slug: "quiz-website",
    images: assets.projects.quizApp,
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed" as const,
    category: "JavaScript",
    github: "https://github.com/Autumnnus/Quiz-Website",
    liveDemo: "https://quiz-project-vector.netlify.app/",
    featured: false,
    translations: {
      tr: {
        title: "Quiz Website",
        shortDescription: "Basit quiz platformu",
        fullDescription:
          "Kullanıcıların soruları cevaplayabileceği temel seviye quiz uygulaması.",
      },
      en: {
        title: "Quiz Website",
        shortDescription: "Basic quiz platform",
        fullDescription:
          "Basic level quiz application where users can answer questions.",
      },
    },
  },
];

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
    period: { tr: "Şub 2024 - Günümüz", en: "Feb 2024 - Present" },
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
    const images = p.images || assets.projects.test;
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
    period: w.period[lang],
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
