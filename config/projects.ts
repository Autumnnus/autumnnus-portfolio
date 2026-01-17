export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  technologies: Technology[];
  status: "Working" | "Building" | "Completed" | "Archived";
  timeline: string;
  role: string;
  team: string;
  github?: string;
  liveDemo?: string;
  featured?: boolean;
  relatedProjects?: string[];
  content?: {
    overview: string;
    features?: string[];
    challenges?: string[];
    learnings?: string[];
  };
}

export interface Technology {
  name: string;
  icon?: string;
}

export const projects: Project[] = [
  {
    slug: "notesbuddy",
    title: "NotesBuddy",
    shortDescription:
      "A comprehensive study platform with notes, flashcards, quizzes, AI chatbot, and interactive learning tools",
    fullDescription:
      "A Notes Sharing Platform where users can read notes, give quizzes, revise from flashcards, execute code snippets, and also have PYQs, more.",
    coverImage: "/projects/notesbuddy.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "React", icon: "⚛️" },
      { name: "Tailwind CSS", icon: "🎨" },
      { name: "Supabase", icon: "🗄️" },
      { name: "Framer Motion", icon: "🎬" },
      { name: "OpenAI", icon: "🤖" },
      { name: "Vercel", icon: "▲" },
      { name: "Stripe", icon: "💳" },
    ],
    status: "Completed",
    timeline: "2 months",
    role: "Full Stack",
    team: "Solo",
    github: "https://github.com/example/notesbuddy",
    liveDemo: "https://notesbuddy.example.com",
    featured: true,
    relatedProjects: ["festx", "syncify"],
    content: {
      overview:
        "NotesBuddy is a comprehensive learning platform that combines note-taking, flashcards, quizzes, and AI-powered assistance to help students study more effectively. Built with modern web technologies and a focus on user experience.",
      features: [
        "Interactive note editor with markdown support",
        "AI-powered chatbot for instant help",
        "Flashcard system with spaced repetition",
        "Quiz generation and tracking",
        "Code snippet execution",
        "Previous year questions (PYQs) database",
        "Progress tracking and analytics",
      ],
      challenges: [
        "Implementing real-time collaboration features",
        "Optimizing AI response times",
        "Managing complex state across multiple features",
      ],
      learnings: [
        "Advanced Next.js patterns and server components",
        "AI integration best practices",
        "Database optimization for large datasets",
      ],
    },
  },
  {
    slug: "appwrite-mcp-server",
    title: "Appwrite MCP Server",
    shortDescription:
      "Model Context Protocol server for seamless Appwrite database operations with 7 powerful tools and 99.9% success...",
    fullDescription:
      "Model Context Protocol server for seamless Appwrite database operations with 7 powerful tools and 99.9% success rate",
    coverImage: "/projects/appwrite-mcp.jpg",
    technologies: [
      { name: "TypeScript", icon: "TS" },
      { name: "Appwrite", icon: "🔥" },
      { name: "Vercel", icon: "▲" },
      { name: "Node.js", icon: "🟢" },
    ],
    status: "Working",
    timeline: "1 month",
    role: "Backend Developer",
    team: "Solo",
    github: "https://github.com/example/appwrite-mcp",
    featured: true,
    relatedProjects: ["notesbuddy"],
    content: {
      overview:
        "A high-performance MCP server that provides seamless integration with Appwrite's database services, enabling developers to build scalable applications quickly.",
      features: [
        "7 powerful database operation tools",
        "99.9% success rate",
        "Type-safe operations",
        "Comprehensive error handling",
      ],
    },
  },
  {
    slug: "festx",
    title: "FestX - Event Management Platform",
    shortDescription:
      "A comprehensive event management platform for college festivals and hackathons, built for...",
    fullDescription:
      "A comprehensive event management platform for college festivals and hackathons, built for seamless organization and participant experience",
    coverImage: "/projects/festx.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "Tailwind CSS", icon: "🎨" },
      { name: "PostgreSQL", icon: "🐘" },
      { name: "Prisma", icon: "◭" },
      { name: "Stripe", icon: "💳" },
    ],
    status: "Completed",
    timeline: "3 months",
    role: "Full Stack Lead",
    team: "Team of 4",
    github: "https://github.com/example/festx",
    liveDemo: "https://festx.example.com",
    featured: true,
    relatedProjects: ["notesbuddy", "syncify"],
    content: {
      overview:
        "FestX is a complete event management solution designed for colleges and organizations to manage festivals, hackathons, and other events efficiently.",
      features: [
        "Event registration and ticketing",
        "Schedule management",
        "Team formation",
        "Payment integration",
        "Real-time updates",
        "Admin dashboard",
      ],
    },
  },
  {
    slug: "syncify",
    title: "Syncify",
    shortDescription:
      "A Music streaming web app with Realtime chat functionality with see what others are listening.",
    fullDescription:
      "A Music streaming web app with Realtime chat functionality where you can see what others are listening to and share your favorite tracks",
    coverImage: "/projects/syncify.jpg",
    technologies: [
      { name: "React", icon: "⚛️" },
      { name: "Tailwind CSS", icon: "🎨" },
      { name: "Vercel", icon: "▲" },
      { name: "Firebase", icon: "🔥" },
      { name: "Spotify API", icon: "🎵" },
      { name: "Socket.io", icon: "🔌" },
      { name: "Redis", icon: "📦" },
    ],
    status: "Completed",
    timeline: "2 months",
    role: "Full Stack",
    team: "Team of 2",
    github: "https://github.com/example/syncify",
    liveDemo: "https://syncify.example.com",
    featured: false,
    relatedProjects: ["festx"],
    content: {
      overview:
        "Syncify brings people together through music by allowing users to see what their friends are listening to in real-time and chat about their favorite tracks.",
      features: [
        "Real-time listening activity",
        "Live chat functionality",
        "Spotify integration",
        "Playlist sharing",
        "Music recommendations",
      ],
    },
  },
  {
    slug: "taskflow",
    title: "TaskFlow - Project Management",
    shortDescription:
      "Agile project management tool with kanban boards, sprints, and team collaboration features",
    fullDescription:
      "A modern project management platform designed for agile teams with kanban boards, sprint planning, and real-time collaboration",
    coverImage: "/projects/taskflow.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "PostgreSQL", icon: "🐘" },
      { name: "Prisma", icon: "◭" },
      { name: "tRPC", icon: "🔷" },
    ],
    status: "Building",
    timeline: "4 months",
    role: "Full Stack",
    team: "Solo",
    github: "https://github.com/example/taskflow",
    featured: false,
    content: {
      overview:
        "TaskFlow is a project management solution built for modern agile teams, offering intuitive kanban boards and sprint planning tools.",
    },
  },
  {
    slug: "portfolyo-template",
    title: "Autumnnus Portfolio Template",
    shortDescription:
      "Beautiful autumn/winter themed pixel art portfolio template for developers",
    fullDescription:
      "A stunning portfolio template with dual autumn/winter themes, pixel art aesthetics, and modern web technologies",
    coverImage: "/projects/portfolio.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "Tailwind CSS", icon: "🎨" },
      { name: "Radix UI", icon: "🎨" },
    ],
    status: "Working",
    timeline: "1 month",
    role: "Frontend Developer",
    team: "Solo",
    github: "https://github.com/example/autumnnus-portfolio",
    liveDemo: "https://autumnnus.example.com",
    featured: true,
    content: {
      overview:
        "A beautiful portfolio template that switches between autumn and winter themes, featuring pixel art aesthetics and smooth animations.",
    },
  },
  {
    slug: "api-gateway",
    title: "Microservices API Gateway",
    shortDescription:
      "High-performance API gateway with rate limiting, caching, and monitoring",
    fullDescription:
      "Enterprise-grade API gateway for microservices architecture with advanced features like rate limiting, caching, and real-time monitoring",
    coverImage: "/projects/api-gateway.jpg",
    technologies: [
      { name: "Node.js", icon: "🟢" },
      { name: "Redis", icon: "📦" },
      { name: "Docker", icon: "🐳" },
      { name: "Kubernetes", icon: "☸️" },
      { name: "PostgreSQL", icon: "🐘" },
    ],
    status: "Working",
    timeline: "6 months",
    role: "Backend Lead",
    team: "Team of 3",
    github: "https://github.com/example/api-gateway",
    featured: false,
    content: {
      overview:
        "A robust API gateway solution designed for microservices architecture with enterprise-level features.",
    },
  },
  {
    slug: "weather-app",
    title: "WeatherNow - PWA",
    shortDescription:
      "Beautiful weather app with 7-day forecasts and widget support",
    fullDescription:
      "A progressive web app for weather forecasting with beautiful UI, offline support, and customizable widgets",
    coverImage: "/projects/weather.jpg",
    technologies: [
      { name: "React", icon: "⚛️" },
      { name: "PWA", icon: "📱" },
      { name: "Weather API", icon: "🌤️" },
      { name: "Service Workers", icon: "⚙️" },
    ],
    status: "Completed",
    timeline: "3 weeks",
    role: "Frontend Developer",
    team: "Solo",
    liveDemo: "https://weather.example.com",
    featured: false,
    content: {
      overview:
        "A beautiful and fast weather application that works offline and provides accurate forecasts.",
    },
  },
  {
    slug: "ecommerce-platform",
    title: "ShopHub - E-commerce Platform",
    shortDescription:
      "Modern e-commerce platform with payment integration and inventory management",
    fullDescription:
      "A full-featured e-commerce platform with payment processing, inventory management, and admin dashboard",
    coverImage: "/projects/ecommerce.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "PostgreSQL", icon: "🐘" },
      { name: "Stripe", icon: "💳" },
      { name: "Prisma", icon: "◭" },
    ],
    status: "Working",
    timeline: "5 months",
    role: "Full Stack",
    team: "Team of 5",
    github: "https://github.com/example/shophub",
    featured: true,
    content: {
      overview:
        "ShopHub is a modern e-commerce platform built with the latest web technologies, offering seamless shopping experiences.",
    },
  },
  {
    slug: "blog-cms",
    title: "BlogCMS",
    shortDescription:
      "Headless CMS for blogs with markdown support and SEO optimization",
    fullDescription:
      "A powerful headless CMS designed specifically for bloggers with markdown support, SEO tools, and analytics",
    coverImage: "/projects/blogcms.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "MDX", icon: "📝" },
      { name: "Tailwind CSS", icon: "🎨" },
      { name: "Contentlayer", icon: "📚" },
    ],
    status: "Completed",
    timeline: "2 months",
    role: "Full Stack",
    team: "Solo",
    github: "https://github.com/example/blogcms",
    featured: false,
    content: {
      overview:
        "A headless CMS that makes blogging easy with markdown support and powerful SEO features.",
    },
  },
  {
    slug: "chatapp",
    title: "ChatConnect",
    shortDescription:
      "Real-time chat application with video calls and file sharing",
    fullDescription:
      "A modern chat application with real-time messaging, video calls, file sharing, and group chats",
    coverImage: "/projects/chatapp.jpg",
    technologies: [
      { name: "React", icon: "⚛️" },
      { name: "Socket.io", icon: "🔌" },
      { name: "WebRTC", icon: "📹" },
      { name: "MongoDB", icon: "🍃" },
      { name: "Redis", icon: "📦" },
    ],
    status: "Building",
    timeline: "3 months",
    role: "Full Stack",
    team: "Team of 2",
    featured: false,
    content: {
      overview:
        "A feature-rich chat application with real-time messaging and video calling capabilities.",
    },
  },
  {
    slug: "devtools",
    title: "DevToolbox",
    shortDescription:
      "Collection of developer utilities and productivity tools",
    fullDescription:
      "A comprehensive collection of developer utilities including code formatters, converters, and productivity tools",
    coverImage: "/projects/devtools.jpg",
    technologies: [
      { name: "Next.js", icon: "▲" },
      { name: "TypeScript", icon: "TS" },
      { name: "Tailwind CSS", icon: "🎨" },
    ],
    status: "Completed",
    timeline: "1 month",
    role: "Frontend Developer",
    team: "Solo",
    liveDemo: "https://devtools.example.com",
    featured: false,
    content: {
      overview:
        "A handy collection of developer tools to boost productivity and simplify common tasks.",
    },
  },
];

export const getProjectBySlug = (slug: string): Project | undefined => {
  return projects.find((p) => p.slug === slug);
};

export const getRelatedProjects = (
  currentSlug: string,
  relatedSlugs?: string[],
): Project[] => {
  if (!relatedSlugs || relatedSlugs.length === 0) {
    return projects.filter((p) => p.slug !== currentSlug).slice(0, 2);
  }

  return projects.filter((p) => relatedSlugs.includes(p.slug));
};

export const getProjectsByStatus = (status: Project["status"]): Project[] => {
  return projects.filter((p) => p.status === status);
};

export const getAllStatuses = (): {
  status: Project["status"];
  count: number;
}[] => {
  const statusCounts = new Map<Project["status"], number>();

  projects.forEach((project) => {
    statusCounts.set(
      project.status,
      (statusCounts.get(project.status) || 0) + 1,
    );
  });

  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
  }));
};
