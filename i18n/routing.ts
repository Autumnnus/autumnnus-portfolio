import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [
    "tr",
    "en",
    "de",
    "fr",
    "es",
    "it",
    "pt",
    "ru",
    "ja",
    "ko",
    "ar",
    "zh",
  ],

  // Used when no locale matches
  defaultLocale: "tr",
  localePrefix: "always",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
