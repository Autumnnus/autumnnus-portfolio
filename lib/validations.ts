import { z } from "zod";

// We can import the Language enum from @prisma/client, but since this runs on client side too
// and we want to avoid importing heavy prisma client code if possible (though types are fine),
// we can define the languages list manually or importing from routing.
// For strict type safety matching DB:
import { languageNames } from "@/i18n/routing";

// Generic schemas for reusable parts
// Generic schemas for reusable parts
// const TranslationFieldSchema = z.string().min(1, "Bu alan zorunludur"); // "This field is required"

const languageEnumValues = Object.keys(languageNames) as [string, ...string[]];

// --- Project ---

// Base translation schema for a single language
const ProjectTranslationSchema = z.object({
  title: z.string(),
  shortDescription: z.string(),
  fullDescription: z.string(),
});

export const ProjectSchema = z.object({
  slug: z.string().min(1, "Slug zorunludur"),
  status: z.string().min(1, "Durum zorunludur"),
  category: z.string().min(1, "Kategori zorunludur"),
  github: z.string().optional().or(z.literal("")),
  liveDemo: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  coverImage: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),

  // We will structure the form to have a translations object keyed by language
  // e.g. translations: { tr: { ... }, en: { ... } }
  // This makes it easier to use with react-hook-form
  translations: z.record(z.enum(languageEnumValues), ProjectTranslationSchema),

  technologies: z.array(z.string()), // Array of skill IDs
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;

// --- Blog ---

const BlogTranslationSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string(),
  readTime: z.string(),
});

export const BlogSchema = z.object({
  slug: z.string().min(1, "Slug zorunludur"),
  coverImage: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  tags: z.string().optional(), // We'll handle CSV string in form, convert to array for API

  translations: z.record(z.enum(languageEnumValues), BlogTranslationSchema),
});

export type BlogFormValues = z.infer<typeof BlogSchema>;

// --- Experience ---

const ExperienceTranslationSchema = z.object({
  role: z.string(),
  description: z.string(),
  locationType: z.string(),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1, "Şirket adı zorunludur"),
  logo: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")), // Input type="date" returns string
  endDate: z.string().optional().or(z.literal("")),

  translations: z.record(
    z.enum(languageEnumValues),
    ExperienceTranslationSchema,
  ),
});

export type ExperienceFormValues = z.infer<typeof ExperienceSchema>;

// --- Profile ---

const ProfileTranslationSchema = z.object({
  name: z.string(),
  title: z.string(),
  greetingText: z.string(),
  description: z.string(),
  aboutTitle: z.string(),
  aboutDescription: z.string(),
});

export const ProfileSchema = z.object({
  avatar: z.string().optional().or(z.literal("")),
  email: z.string().email("Geçerli bir email giriniz"),
  github: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),

  translations: z.record(z.enum(languageEnumValues), ProfileTranslationSchema),
});

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
