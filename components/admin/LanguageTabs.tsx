import { languageNames } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface LanguageTabsProps {
  sourceLang: string;
  targetLangs: string[];
  children: (lang: string, isSource: boolean) => React.ReactNode;
}

export default function LanguageTabs({
  sourceLang,
  targetLangs,
  children,
}: LanguageTabsProps) {
  const t = useTranslations("Admin.Common");
  const [activeTab, setActiveTab] = useState(sourceLang);

  const currentTab =
    activeTab !== sourceLang && !targetLangs.includes(activeTab)
      ? sourceLang
      : activeTab;

  // Combine sourceLang with unique targetLangs
  const activeLangs = Array.from(new Set([sourceLang, ...targetLangs]));

  return (
    <div className="space-y-0">
      {/* Tabs Header */}
      <div className="flex items-end gap-1 border-b border-border/50 px-2 pt-2 overflow-x-auto custom-scrollbar pb-1">
        {activeLangs.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveTab(lang)}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-t-xl transition-all border-b-2 bg-background z-10 -mb-[2px] whitespace-nowrap shrink-0 ${
              currentTab === lang
                ? "border-primary text-primary bg-muted/20"
                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Globe
              className={`w-4 h-4 ${currentTab === lang ? "text-primary" : "opacity-50"}`}
            />
            {languageNames[lang as keyof typeof languageNames] ||
              lang.toUpperCase()}
            {lang === sourceLang && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ml-1 ${currentTab === lang ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {t("source")}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-muted/10 border border-border/50 rounded-b-xl rounded-tr-xl shadow-sm relative z-0">
        {activeLangs.map((lang) => (
          <div
            key={lang}
            className={
              currentTab === lang
                ? "block animate-in fade-in zoom-in-95 duration-200"
                : "hidden"
            }
          >
            {children(lang, lang === sourceLang)}
          </div>
        ))}
      </div>
    </div>
  );
}
