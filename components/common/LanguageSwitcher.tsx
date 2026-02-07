import { Button } from "@/components/ui/button";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

const languageNames: Record<string, string> = {
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

export default function LanguageSwitcher() {
  const locale = useLocale();
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

    // Defensive check: strip any existing locale prefix from the pathname.
    // This prevents nested URLs like /tr/en/projects when switching languages.
    const cleanPath = pathname.replace(
      /^\/(tr|en|de|fr|es|it|pt|ru|ja|ko|ar|zh)(\/|$)/,
      "/",
    );

    // Using string-based replace with the cleaned, unlocalized pathname.
    router.replace(cleanPath, { locale: nextLocale });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-border"
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-pixel uppercase tracking-tighter">
          {locale}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border-4 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] rounded-none z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {routing.locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLanguageChange(loc)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 ${
                  locale === loc
                    ? "text-primary bg-secondary/30"
                    : "text-foreground/70"
                }`}
              >
                <span className={locale === loc ? "font-bold" : ""}>
                  {languageNames[loc] || loc.toUpperCase()}
                </span>
                {locale === loc && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
