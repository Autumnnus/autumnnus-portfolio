import { StaticImageData } from "next/image";

export type Language =
  | "tr"
  | "en"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "ru"
  | "ja"
  | "ko"
  | "ar"
  | "zh";

export interface GithubRepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  language: string;
  defaultBranch: string;
}

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
  avatar: string | StaticImageData;
  description: string;
  skills: Technology[];
  buttons: Button[];
  socialLinks: SocialLink[];
}

export interface AboutSection {
  title: string;
  description: string;
  experienceLabel: string;
  projectCount: string;
  projectLabel: string;
  githubActivityTitle: string;
  avatar: string | StaticImageData;
}

export type ProjectStatus = "Working" | "Building" | "Completed" | "Archived";

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string | StaticImageData | null;
  images: (string | StaticImageData)[];
  technologies: Technology[];
  status: ProjectStatus;
  categoryId: string;
  category?: { id: string; name: string };
  github?: string | null;
  liveDemo?: string | null;
  featured?: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  coverImage?: string | StaticImageData | null;
  tags: string[];
  featured?: boolean;
  content: string;
  status: "draft" | "published";
  categoryId: string;
  category?: { id: string; name: string };
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  locationType: string;
  description: string;
  logo: string | StaticImageData;
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
    categoryLabel: string;
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

export type PortfolioConfig = Record<Language, ContentConfig>;

export interface DataWithTranslations<TCommon, TLocalized> {
  common: TCommon;
  translations: Record<Language, TLocalized>;
}
