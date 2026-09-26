"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { languageNames, routing, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const commonT = useTranslations("Admin.Common");
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (nextLocale: string) => {
    setIsOpen(false);

    const cleanPath = pathname.replace(/^\/(tr|en)(\/|$)/, "/");

    router.replace(cleanPath, { locale: nextLocale });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={commonT("selectLanguage")}
        className="pixel-button pixel-button-sm gap-2 px-3 uppercase"
      >
        {locale}
        <PixelIcon
          name="caretDown"
          className={cn("h-1.5 w-3 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={commonT("selectLanguage")}
          className="pixel-panel absolute right-0 z-[60] mt-4 w-44 p-1.5"
        >
          {routing.locales.map((loc) => (
            <li key={loc} role="option" aria-selected={locale === loc}>
              <button
                type="button"
                onClick={() => handleLanguageChange(loc)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 font-pixel text-base transition-colors duration-100 hover:bg-primary/20",
                  locale === loc && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {languageNames[loc] || loc.toUpperCase()}
                {locale === loc && <PixelIcon name="check" className="h-2.5 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
