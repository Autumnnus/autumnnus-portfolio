import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const languageNames: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  zh: "中文",
};

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: Object.keys(languageNames),

  // Used when no locale matches
  defaultLocale: "tr",
  localePrefix: "always",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
