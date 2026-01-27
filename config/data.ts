export const SKILLS = {
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

export const SOCIAL_LINKS = {
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

export const PROJECTS_BASE_DATA = [
  // Backend Projects
  {
    slug: "e-commerce-api",
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
    technologies: [
      SKILLS.TYPESCRIPT,
      SKILLS.EXPRESS,
      SKILLS.MONGODB,
      SKILLS.AWS,
    ],
    status: "Completed" as const,
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
  },
  {
    slug: "qa-rest-api",
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
  },
  {
    slug: "js-methods",
    technologies: [SKILLS.REACT, SKILLS.TYPESCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
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
  },
  {
    slug: "my-games-old",
    technologies: [
      SKILLS.REACT,
      SKILLS.JAVASCRIPT,
      SKILLS.REDUX,
      SKILLS.FIREBASE,
    ],
    status: "Archived" as const,
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
  },
  {
    slug: "whatsapp-clone",
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
    technologies: [SKILLS.REACT, SKILLS.JAVASCRIPT, SKILLS.REDUX],
    status: "Completed" as const,
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
  },

  // JavaScript Projects
  {
    slug: "calculator",
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
