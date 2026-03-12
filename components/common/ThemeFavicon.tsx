"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_FAVICONS: Record<string, string> = {
  light: "/images/autumn.png",
  dark: "/images/winter.png",
};

export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const activeTheme = resolvedTheme || "light";
    const href = activeTheme === "dark" ? THEME_FAVICONS.dark : THEME_FAVICONS.light;
    let faviconLink = document.head.querySelector<HTMLLinkElement>("link[rel~='icon']");

    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.setAttribute("rel", "icon");
      document.head.appendChild(faviconLink);
    }

    if (faviconLink.href !== href) {
      faviconLink.href = href;
    }
  }, [resolvedTheme]);

  return null;
}
