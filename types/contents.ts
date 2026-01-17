export type Language = "tr" | "en";

export interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

export interface Technology {
  name: string;
  icon: string;
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

export type ProjectStatus = "Working" | "Building" | "Completed" | "Archived";

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  technologies: Technology[];
  status: ProjectStatus;
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
  logo: string;
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
    commentsTitle: string;
    signInToComment: string;
    joinConversation: string;
    signInButton: string;
    signedInAs: string;
    postComment: string;
    noCommentsYet: string;
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

// Helper types for refactored data management
export interface DataWithTranslations<TCommon, TLocalized> {
  common: TCommon;
  translations: Record<Language, TLocalized>;
}
