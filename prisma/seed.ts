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

const SOCIAL_LINKS_DATA = [
  {
    key: "GITHUB",
    name: "GitHub",
    href: "https://github.com/Autumnnus",
    icon: "https://cdn.simpleicons.org/github/181717",
  },
  {
    key: "LINKEDIN",
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/kadir-topcu/",
    icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
  },
  {
    key: "EMAIL",
    name: "Email",
    href: "mailto:akadir.38@gmail.com",
    icon: "https://cdn.simpleicons.org/gmail/EA4335",
  },
];

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
          "Spring Boot ve PostgreSQL kullanılarak geliştirilmiş, kapsamlı bir E-Ticaret REST API'si.",
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
    slug: "gallerist",
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed",
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
    imagePaths: [],
  },
  {
    slug: "spring-boot-tutorials",
    technologies: [SKILLS.JAVA, SKILLS.SPRING_BOOT, SKILLS.POSTGRES],
    status: "Completed",
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
    imagePaths: [],
  },
  {
    slug: "my-games-backend",
    technologies: [
      SKILLS.TYPESCRIPT,
      SKILLS.EXPRESS,
      SKILLS.MONGODB,
      SKILLS.AWS,
    ],
    status: "Completed",
    category: "Backend",
    github: "https://github.com/Autumnnus/my-games-backend",
    featured: true,
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
    imagePaths: [],
  },
  {
    slug: "qa-rest-api",
    technologies: [SKILLS.JAVASCRIPT, SKILLS.EXPRESS, SKILLS.MONGODB],
    status: "Completed",
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
          "Oyuncuların oyun verilerini saklayabileceği ve yönetebileceği, React ile geliştirilmiş (Refactored) web uygulaması.",
      },
      en: {
        title: "My Games",
        shortDescription: "Game collection management platform",
        fullDescription:
          "Web application developed with React (Refactored) where players can store and manage their game data.",
      },
    },
    imagePaths: [
      "assets/projects/my-games/index-1.png",
      "assets/projects/my-games/index-2.png",
      "assets/projects/my-games/index-3.png",
    ],
  },
  {
    slug: "star-wars-apollo",
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.GRAPHQL,
    ],
    status: "Completed",
    category: "Frontend",
    github: "https://github.com/Autumnnus/starwars-apollo-graphql",
    liveDemo: "https://starwars-apollo-graphql.netlify.app/",
    featured: false,
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
    imagePaths: [
      "assets/projects/star-wars-apollo/index-1.png",
      "assets/projects/star-wars-apollo/index-2.png",
    ],
  },
  {
    slug: "js-methods",
    technologies: [SKILLS.REACT, SKILLS.TYPESCRIPT, SKILLS.REDUX],
    status: "Completed",
    category: "Frontend",
    github: "https://github.com/Autumnnus/Javascript-Methods",
    liveDemo: "https://javascriptmethods.netlify.app",
    featured: true,
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
    imagePaths: [
      "assets/projects/javascript-methods/index-1.png",
      "assets/projects/javascript-methods/index-2.png",
      "assets/projects/javascript-methods/index-3.png",
    ],
  },
  {
    slug: "my-games-old",
    technologies: [
      SKILLS.REACT,
      SKILLS.JAVASCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Archived",
    category: "Frontend",
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
    imagePaths: [
      "assets/projects/my-games-legacy/index-1.png",
      "assets/projects/my-games-legacy/index-2.png",
      "assets/projects/my-games-legacy/index-3.png",
    ],
  },
  {
    slug: "whatsapp-clone",
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Completed",
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
    imagePaths: [
      "assets/projects/whatsapp-clone/index.png",
      "assets/projects/whatsapp-clone/index-2.png",
    ],
  },
  {
    slug: "flight-app",
    technologies: [
      SKILLS.REACT,
      SKILLS.TYPESCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Completed",
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
    imagePaths: [
      "assets/projects/flight-app/index-1.png",
      "assets/projects/flight-app/index-2.png",
    ],
  },
  {
    slug: "movie-app",
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed",
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
    imagePaths: ["assets/projects/movie-app/index.png"],
  },
  {
    slug: "product-app",
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed",
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
    imagePaths: ["assets/projects/product-app/index.png"],
  },
  {
    slug: "e-commerce-frontend",
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed",
    category: "Frontend",
    github: "https://github.com/Autumnnus/E-Commerce-React-Redux-",
    liveDemo: "https://e-commerce-vector-shop.netlify.app/",
    featured: false,
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
    imagePaths: [
      "assets/projects/e-commerce/index-1.png",
      "assets/projects/e-commerce/index-2.png",
      "assets/projects/e-commerce/index-3.png",
    ],
  },
  {
    slug: "calculator",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: [
      "assets/projects/calculator/index-1.png",
      "assets/projects/calculator/index-2.png",
      "assets/projects/calculator/index-3.png",
      "assets/projects/calculator/index-4.png",
      "assets/projects/calculator/index-5.png",
      "assets/projects/calculator/index-6.png",
    ],
  },
  {
    slug: "fast-localization",
    technologies: [SKILLS.NODEJS],
    status: "Completed",
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
    imagePaths: [],
  },
  {
    slug: "pdx-modifier",
    technologies: [SKILLS.NODEJS],
    status: "Completed",
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
    imagePaths: [],
  },
  {
    slug: "github-user-info",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/github-user-info/index.png"],
  },
  {
    slug: "currency-converter",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/currency-converter/index.png"],
  },
  {
    slug: "music-player",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/music-player/index.png"],
  },
  {
    slug: "country-info",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/country-info/index.png"],
  },
  {
    slug: "weather-app",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/weather-app/weather-app.png"],
  },
  {
    slug: "color-flipper",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: ["assets/projects/color-flipper/color-flipper.png"],
  },
  {
    slug: "quiz-website",
    technologies: [SKILLS.JAVASCRIPT],
    status: "Completed",
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
    imagePaths: [
      "assets/projects/quiz-website/quiz-app.png",
      "assets/projects/quiz-website/quiz-app-2.png",
      "assets/projects/quiz-website/quiz-app-3.png",
    ],
  },
];

const BLOG_DATA = [
  {
    slug: "hello-world",
    coverImagePath: "assets/projects/test.png",
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
        date: "January 17, 2026",
        readTime: "5 min read",
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
    translations: {
      tr: {
        role: "Full Stack Developer",
        period: "Şub 2024 - Günümüz",
        locationType: "Hibrit",
        description:
          "- React, Zustand ve React Hook Form kullanarak kullanıcı dostu arayüzler geliştirdim.\n- Node.js ve MongoDB ile ölçeklenebilir backend API’leri oluşturdum.\n- OpenAI, Embeddings ve Pinecone kullanarak RAG kontrollü bir AI modülünün temelini ve geliştirilmesini destekledim.\n- Clean Code, SOLID ve katmanlı mimari prensiplerini (Onion Architecture, CQRS) uyguladım.\n- Ekip içi iş birliği için Jira, Bitbucket ve GraphQL gibi araçları etkin şekilde kullandım.",
      },
      en: {
        role: "Full Stack Developer",
        period: "Feb 2024 - Present",
        locationType: "Hybrid",
        description:
          "- Built user-friendly frontend interfaces using React, Zustand, and React Hook Form.\n- Developed scalable backend APIs with Node.js and MongoDB.\n- Contributed to the foundation and development of an AI module powered by RAG using OpenAI, Embeddings, and Pinecone.\n- Applied Clean Code, SOLID, and layered architecture principles (Onion Architecture, CQRS).\n- Effectively collaborated using tools such as Jira, Bitbucket, and GraphQL.",
      },
    },
  },
];

async function main() {
  console.log("Starting seed with standalone configuration...");

  // Seed Social Links
  for (const s of SOCIAL_LINKS_DATA) {
    await prisma.socialLink.upsert({
      where: { key: s.key },
      update: {
        name: s.name,
        href: s.href,
        icon: s.icon,
      },
      create: {
        key: s.key,
        name: s.name,
        href: s.href,
        icon: s.icon,
      },
    });
  }
  console.log("Social links seeded.");

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
  const PROJECT_ASSET_DIR_MAP: Record<string, string> = {
    "e-commerce-frontend": "e-commerce",
    "js-methods": "javascript-methods",
    "my-games-old": "my-games-legacy",
  };

  for (const p of PROJECTS_DATA) {
    const uploadedImages: string[] = [];
    const assetDirName = PROJECT_ASSET_DIR_MAP[p.slug] || p.slug;
    const projectAssetsDir = path.join(
      process.cwd(),
      "assets",
      "projects",
      assetDirName,
    );

    if (fs.existsSync(projectAssetsDir)) {
      const files = fs.readdirSync(projectAssetsDir);
      // Filter for image files
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext);
      });

      // Sort files to ensure deterministic order (optional but good for 'index-1', 'index-2' etc)
      imageFiles.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );

      for (const file of imageFiles) {
        const filePath = path.join(projectAssetsDir, file);
        const buffer = fs.readFileSync(filePath);
        // Desired MinIO key: projects/<slug>/<filename>
        const filename = `projects/${p.slug}/${file}`;
        const ext = path.extname(file).toLowerCase();

        let contentType = "application/octet-stream";
        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".webp") contentType = "image/webp";
        else if (ext === ".svg") contentType = "image/svg+xml";

        try {
          const url = await uploadFile(filename, buffer, contentType);
          uploadedImages.push(url);
          console.log(`Uploaded ${filename} to ${url}`);
        } catch (e) {
          console.error(`Failed to upload ${filePath}:`, e);
        }
      }
    } else {
      // It's okay if backend projects don't have assets folder
      // console.warn(`Asset directory not found for project ${p.slug} at ${projectAssetsDir}`);
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
  await prisma.workExperience.deleteMany({});
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
