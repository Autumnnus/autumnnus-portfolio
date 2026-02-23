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

const ProjectTranslationSchema = z.object({
  title: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  fullDescription: z.string().optional().default(""),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
});

export const ProjectSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug zorunludur")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug sadece küçük harf, rakam ve tire (-) içerebilir, boşluk içeremez.",
    ),
  status: z.string().min(1, "Durum zorunludur"),
  category: z.string().min(1, "Kategori zorunludur"),
  github: z.string().optional().or(z.literal("")),
  liveDemo: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  coverImage: z.string().optional().or(z.literal("")),
  imageAlt: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),

  translations: z
    .record(
      z.enum(languageEnumValues),
      z.preprocess((val) => val || {}, ProjectTranslationSchema.optional()),
    )
    .refine(
      (data) => {
        return Object.values(data).some(
          (t) =>
            t &&
            t.title &&
            t.title.trim() !== "" &&
            t.shortDescription &&
            t.shortDescription.trim() !== "",
        );
      },
      {
        message:
          "En az bir dilde proje detaylarını (Ad ve Kısa Açıklama) doldurmalısınız.",
        path: ["translations"],
      },
    ),

  technologies: z.array(z.string()),
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;

//--- Blog ---

const BlogTranslationSchema = z.object({
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  content: z.string().optional().default(""),
  readTime: z.string().optional().default("5 dk okuma"),
  excerpt: z.string().optional().default(""),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
});

export const BlogSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug zorunludur")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug sadece küçük harf, rakam ve tire (-) içerebilir, boşluk içeremez.",
    ),
  coverImage: z.string().default(""),
  imageAlt: z.string().default(""),
  featured: z.boolean().default(false),
  tags: z.string().default(""),
  category: z.string().default(""),
  status: z.string().default("draft"),
  commentsEnabled: z.boolean().default(true),
  translations: z
    .record(
      z.enum(languageEnumValues),
      z.preprocess((val) => val || {}, BlogTranslationSchema.optional()),
    )
    .superRefine((data, ctx) => {
      const hasAnyFilled = Object.values(data).some(
        (t) => t && t.title && t.title.trim() !== "",
      );

      if (!hasAnyFilled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "En az bir dilde içerik (Başlık) doldurmalısınız.",
          path: [],
        });
      }

      Object.entries(data).forEach(([lang, t]) => {
        if (!t) return;

        if (t.title && t.title.trim() !== "") {
          if (
            !t.content ||
            t.content.trim() === "" ||
            t.content === "<p></p>"
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Başlık yazılan dilde İçerik de zorunludur.",
              path: [lang, "content"],
            });
          }
        } else if (
          t.content &&
          t.content.trim() !== "" &&
          t.content !== "<p></p>"
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "İçerik yazılan dilde Başlık da zorunludur.",
            path: [lang, "title"],
          });
        }
      });
    }),
});

export type BlogFormValues = z.infer<typeof BlogSchema>;

// --- Experience ---

const ExperienceTranslationSchema = z.object({
  role: z.string().optional().default(""),
  description: z.string().optional().default(""),
  locationType: z.string().optional().default(""),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1, "Şirket adı zorunludur"),
  logo: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),

  translations: z
    .record(
      z.enum(languageEnumValues),
      z.preprocess((val) => val || {}, ExperienceTranslationSchema.optional()),
    )
    .superRefine((data, ctx) => {
      const hasAnyFilled = Object.values(data).some(
        (t) => t && t.role && t.role.trim() !== "",
      );

      if (!hasAnyFilled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "En az bir dilde deneyim detaylarını doldurmalısınız.",
          path: [],
        });
      }

      Object.entries(data).forEach(([lang, t]) => {
        if (!t) return;
        const anyField =
          (t.role && t.role.trim() !== "") ||
          (t.description && t.description.trim() !== "") ||
          (t.locationType && t.locationType.trim() !== "");

        if (anyField) {
          if (!t.role || t.role.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pozisyon zorunludur",
              path: [lang, "role"],
            });
          }
          if (!t.description || t.description.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Açıklama zorunludur",
              path: [lang, "description"],
            });
          }
          if (!t.locationType || t.locationType.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Çalışma tipi zorunludur",
              path: [lang, "locationType"],
            });
          }
        }
      });
    }),
});

export type ExperienceFormValues = z.infer<typeof ExperienceSchema>;

// --- Profile ---

const ProfileTranslationSchema = z.object({
  name: z.string().optional().default(""),
  title: z.string().optional().default(""),
  greetingText: z.string().optional().default(""),
  description: z.string().optional().default(""),
  aboutTitle: z.string().optional().default(""),
  aboutDescription: z.string().optional().default(""),
});

export const ProfileSchema = z.object({
  avatar: z.string().optional().or(z.literal("")),
  email: z.string().email("Geçerli bir email giriniz"),
  github: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),

  translations: z
    .record(
      z.enum(languageEnumValues),
      z.preprocess((val) => val || {}, ProfileTranslationSchema.optional()),
    )
    .superRefine((data, ctx) => {
      const hasAnyFilled = Object.values(data).some(
        (t) => t && t.name && t.name.trim() !== "",
      );

      if (!hasAnyFilled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "En az bir dilde profil detaylarını doldurmalısınız.",
          path: [],
        });
      }

      Object.entries(data).forEach(([lang, t]) => {
        if (!t) return;

        const anyFieldFilled =
          (t.name && t.name.trim() !== "") ||
          (t.title && t.title.trim() !== "") ||
          (t.greetingText && t.greetingText.trim() !== "") ||
          (t.description && t.description.trim() !== "") ||
          (t.aboutTitle && t.aboutTitle.trim() !== "") ||
          (t.aboutDescription && t.aboutDescription.trim() !== "");

        if (anyFieldFilled) {
          if (!t.name || t.name.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "İsim zorunludur",
              path: [lang, "name"],
            });
          }
          if (!t.title || t.title.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Ünvan zorunludur",
              path: [lang, "title"],
            });
          }
          if (!t.greetingText || t.greetingText.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Karşılama metni zorunludur",
              path: [lang, "greetingText"],
            });
          }
          if (!t.description || t.description.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Açıklama zorunludur",
              path: [lang, "description"],
            });
          }
          if (!t.aboutTitle || t.aboutTitle.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Hakkında başlığı zorunludur",
              path: [lang, "aboutTitle"],
            });
          }
          if (!t.aboutDescription || t.aboutDescription.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Hakkında açıklaması zorunludur",
              path: [lang, "aboutDescription"],
            });
          }
        }
      });
    }),
  quests: z
    .array(
      z.object({
        id: z.string().optional(),
        completed: z.boolean().default(false),
        order: z.number().default(0),
        translations: z
          .record(
            z.enum(languageEnumValues),
            z.preprocess(
              (val) => val || {},
              z.object({
                title: z.string().optional().or(z.literal("")),
              }),
            ),
          )
          .optional()
          .default({}),
      }),
    )
    .default([]),
});

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
