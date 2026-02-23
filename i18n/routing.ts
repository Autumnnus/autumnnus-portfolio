import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const languageNames: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
};

export const routing = defineRouting({
  locales: Object.keys(languageNames),
  defaultLocale: "tr",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
