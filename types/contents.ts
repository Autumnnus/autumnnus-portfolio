export type Language = "tr" | "en";

export interface SocialLink {
  name: string;
  href: string;
  icon: string; // URL for SVG or Lucide icon name
}

export interface Technology {
  name: string;
  icon: string; // URL for SVG
}

export interface Button {
  text: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface HeroSection {
  greetingText: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  skills: Technology[];
  buttons: Button[];
  socialLinks: SocialLink[];
}

export interface AboutSection {
  title: string;
  description: string;
  experienceCount: string;
  experienceLabel: string;
  projectCount: string;
  projectLabel: string;
  githubActivityTitle: string;
  avatar: string;
}

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string; // Path to image
  technologies: Technology[];
  status: "Working" | "Building" | "Completed" | "Archived";
  timeline: string;
  role: string;
  team: string;
  github?: string;
  liveDemo?: string;
  featured?: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  coverImage: string;
  tags: string[];
  featured?: boolean;
  content: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  period: string;
  description: string;
  logo: string; // URL for SVG
}

export interface NavigationItem {
  name: string;
  href: string;
}

export interface ContentConfig {
  navbar: {
    items: NavigationItem[];
  };
  hero: HeroSection;
  about: AboutSection;
  projects: {
    title: string;
    description: string;
    viewAllText: string;
    filterByStatusText: string;
    allProjectsText: string;
    projectCountText: string;
    noResultsText: string;
    backToProjectsText: string;
    timelineLabel: string;
    roleLabel: string;
    statusLabel: string;
    liveDemoText: string;
    sourceCodeText: string;
    nextProjectText: string;
    relatedProjectsText: string;
    items: Project[];
  };
  blog: {
    title: string;
    description: string;
    viewAllText: string;
    popularTagsText: string;
    postCountText: string;
    noResultsText: string;
    backToBlogText: string;
    items: BlogPost[];
  };
  work: {
    title: string;
    description: string;
    allExperiencesText: string;
    experienceCountText: string;
    items: WorkExperience[];
  };
  footer: {
    text: string;
    socialLinks: SocialLink[];
  };
}

export interface PortfolioConfig {
  tr: ContentConfig;
  en: ContentConfig;
}
