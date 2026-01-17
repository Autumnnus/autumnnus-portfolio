import { PortfolioConfig } from "@/types/contents";

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
      skills: [
        {
          name: "TypeScript",
          icon: "https://cdn.simpleicons.org/typescript/3178C6",
        },
        { name: "React", icon: "https://cdn.simpleicons.org/react/61DAFB" },
        {
          name: "Next.js",
          icon: "https://cdn.simpleicons.org/nextdotjs/000000",
        },
        {
          name: "Node.js",
          icon: "https://cdn.simpleicons.org/nodedotjs/339933",
        },
        {
          name: "PostgreSQL",
          icon: "https://cdn.simpleicons.org/postgresql/4169E1",
        },
      ],
      buttons: [
        { text: "Projelerim", href: "#projects", variant: "primary" },
        { text: "İletişim", href: "/contact", variant: "secondary" },
      ],
      socialLinks: [
        {
          name: "GitHub",
          href: "https://github.com",
          icon: "https://cdn.simpleicons.org/github/181717",
        },
        {
          name: "LinkedIn",
          href: "https://linkedin.com",
          icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
        },
        {
          name: "Twitter",
          href: "https://twitter.com",
          icon: "https://cdn.simpleicons.org/x/000000",
        },
        {
          name: "Email",
          href: "mailto:hello@example.com",
          icon: "https://cdn.simpleicons.org/gmail/EA4335",
        },
      ],
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
      items: [
        {
          slug: "notesbuddy",
          title: "NotesBuddy",
          shortDescription:
            "Notlar, bilgi kartları ve yapay zeka destekli kapsamlı bir çalışma platformu",
          fullDescription:
            "Kullanıcıların not okuyabileceği, test çözebileceği, bilgi kartlarından tekrar yapabileceği ve kod parçacıklarını çalıştırabileceği bir not paylaşım platformu.",
          coverImage: "/projects/notesbuddy.jpg",
          technologies: [
            {
              name: "Next.js",
              icon: "https://cdn.simpleicons.org/nextdotjs/000000",
            },
            {
              name: "TypeScript",
              icon: "https://cdn.simpleicons.org/typescript/3178C6",
            },
            {
              name: "Tailwind CSS",
              icon: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
            },
          ],
          status: "Completed",
          timeline: "2 ay",
          role: "Full Stack",
          team: "Solo",
          featured: true,
          github: "https://github.com/example/notesbuddy",
          liveDemo: "https://notesbuddy.example.com",
        },
        {
          slug: "festx",
          title: "FestX - Etkinlik Yönetim Platformu",
          shortDescription:
            "Üniversite festivalleri ve hackathonlar için kapsamlı etkinlik yönetim platformu",
          fullDescription:
            "Üniversite festivalleri ve hackathonların sorunsuz organizasyonu ve katılımcı deneyimi için oluşturulmuş kapsamlı bir etkinlik yönetim platformu",
          coverImage: "/projects/festx.jpg",
          technologies: [
            {
              name: "Next.js",
              icon: "https://cdn.simpleicons.org/nextdotjs/000000",
            },
            {
              name: "TypeScript",
              icon: "https://cdn.simpleicons.org/typescript/3178C6",
            },
            {
              name: "PostgreSQL",
              icon: "https://cdn.simpleicons.org/postgresql/4169E1",
            },
          ],
          status: "Completed",
          timeline: "3 ay",
          role: "Full Stack Lider",
          team: "4 Kişilik Ekip",
          github: "https://github.com/example/festx",
          liveDemo: "https://festx.example.com",
          featured: true,
        },
      ],
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
      items: [
        {
          slug: "hello-world",
          title: "Merhaba Dünya: Yazılım Yolculuğum",
          description: "Yazılım dünyasına nasıl adım attım ve neler öğrendim?",
          date: "17 Ocak 2026",
          readTime: "5 dk okuma",
          coverImage: "/blog/hello.jpg",
          tags: ["Kariyer", "Yazılım"],
          featured: true,
          content: `
## Yazılım Dünyasına Giriş
Yazılım dünyasına attığım ilk adım...

### Neler Öğrendim?
- Problem çözme yeteneği
- Sürekli öğrenme disiplini
          `,
        },
      ],
    },
    work: {
      title: "Deneyimler",
      description: "Farklı şirketler ve rollerdeki iş deneyimlerim.",
      allExperiencesText: "Tüm Deneyimler",
      experienceCountText: "deneyim",
      items: [
        {
          company: "Tech Solutions",
          role: "Frontend Developer",
          period: "2024 - Günümüz",
          description:
            "Modern web uygulamaları geliştirme ve kullanıcı arayüzü optimizasyonu.",
          logo: "https://cdn.simpleicons.org/vercel/000000",
        },
      ],
    },
    footer: {
      text: "© 2026 Kadir. Tüm hakları saklıdır.",
      socialLinks: [
        {
          name: "GitHub",
          href: "https://github.com",
          icon: "https://cdn.simpleicons.org/github/181717",
        },
        {
          name: "Twitter",
          href: "https://twitter.com",
          icon: "https://cdn.simpleicons.org/x/000000",
        },
      ],
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
      skills: [
        {
          name: "TypeScript",
          icon: "https://cdn.simpleicons.org/typescript/3178C6",
        },
        { name: "React", icon: "https://cdn.simpleicons.org/react/61DAFB" },
        {
          name: "Next.js",
          icon: "https://cdn.simpleicons.org/nextdotjs/000000",
        },
        {
          name: "Node.js",
          icon: "https://cdn.simpleicons.org/nodedotjs/339933",
        },
        {
          name: "PostgreSQL",
          icon: "https://cdn.simpleicons.org/postgresql/4169E1",
        },
      ],
      buttons: [
        { text: "My Projects", href: "#projects", variant: "primary" },
        { text: "Contact Me", href: "/contact", variant: "secondary" },
      ],
      socialLinks: [
        {
          name: "GitHub",
          href: "https://github.com",
          icon: "https://cdn.simpleicons.org/github/181717",
        },
        {
          name: "LinkedIn",
          href: "https://linkedin.com",
          icon: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg",
        },
        {
          name: "Twitter",
          href: "https://twitter.com",
          icon: "https://cdn.simpleicons.org/x/000000",
        },
        {
          name: "Email",
          href: "mailto:hello@example.com",
          icon: "https://cdn.simpleicons.org/gmail/EA4335",
        },
      ],
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
      items: [
        {
          slug: "notesbuddy",
          title: "NotesBuddy",
          shortDescription:
            "A comprehensive study platform with notes, flashcards, and AI support",
          fullDescription:
            "A Notes Sharing Platform where users can read notes, give quizzes, revise from flashcards, execute code snippets, and also have PYQs, more.",
          coverImage: "/projects/notesbuddy.jpg",
          technologies: [
            {
              name: "Next.js",
              icon: "https://cdn.simpleicons.org/nextdotjs/000000",
            },
            {
              name: "TypeScript",
              icon: "https://cdn.simpleicons.org/typescript/3178C6",
            },
            {
              name: "Tailwind CSS",
              icon: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
            },
          ],
          status: "Completed",
          timeline: "2 months",
          role: "Full Stack",
          team: "Solo",
          featured: true,
          github: "https://github.com/example/notesbuddy",
          liveDemo: "https://notesbuddy.example.com",
        },
        {
          slug: "festx",
          title: "FestX - Event Management Platform",
          shortDescription:
            "A comprehensive event management platform for college festivals and hackathons",
          fullDescription:
            "A comprehensive event management platform for college festivals and hackathons, built for seamless organization and participant experience",
          coverImage: "/projects/festx.jpg",
          technologies: [
            {
              name: "Next.js",
              icon: "https://cdn.simpleicons.org/nextdotjs/000000",
            },
            {
              name: "TypeScript",
              icon: "https://cdn.simpleicons.org/typescript/3178C6",
            },
            {
              name: "PostgreSQL",
              icon: "https://cdn.simpleicons.org/postgresql/4169E1",
            },
          ],
          status: "Completed",
          timeline: "3 months",
          role: "Full Stack Lead",
          team: "Team of 4",
          github: "https://github.com/example/festx",
          liveDemo: "https://festx.example.com",
          featured: true,
        },
      ],
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
      items: [
        {
          slug: "hello-world",
          title: "Hello World: My Software Journey",
          description:
            "How I stepped into the world of software and what I learned.",
          date: "January 17, 2026",
          readTime: "5 min read",
          coverImage: "/blog/hello.jpg",
          tags: ["Career", "Software"],
          featured: true,
          content: `
## Entering the Software World
My first step into the world of software...

### What I Learned?
- Problem solving skills
- Discipline of continuous learning
          `,
        },
      ],
    },
    work: {
      title: "Experience",
      description: "My work experiences across different companies and roles.",
      allExperiencesText: "All Experiences",
      experienceCountText: "experiences",
      items: [
        {
          company: "Tech Solutions",
          role: "Frontend Developer",
          period: "2024 - Present",
          description:
            "Developing modern web applications and optimizing user interfaces.",
          logo: "https://cdn.simpleicons.org/vercel/000000",
        },
      ],
    },
    footer: {
      text: "© 2026 Kadir. All rights reserved.",
      socialLinks: [
        {
          name: "GitHub",
          href: "https://github.com",
          icon: "https://cdn.simpleicons.org/github/181717",
        },
        {
          name: "Twitter",
          href: "https://twitter.com",
          icon: "https://cdn.simpleicons.org/x/000000",
        },
      ],
    },
  },
};
