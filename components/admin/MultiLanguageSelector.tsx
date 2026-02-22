import { languageNames } from "@/i18n/routing";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface MultiLanguageSelectorProps {
  sourceLang: string;
  targetLangs: string[];
  onChange: (langs: string[]) => void;
}

export default function MultiLanguageSelector({
  sourceLang,
  targetLangs,
  onChange,
}: MultiLanguageSelectorProps) {
  const t = useTranslations("Admin.Form");
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

  const toggleLang = (lang: string) => {
    if (targetLangs.includes(lang)) {
      onChange(targetLangs.filter((l) => l !== lang));
    } else {
      onChange([...targetLangs, lang]);
    }
  };

  const selectAll = () => {
    const allLangs = Object.keys(languageNames).filter((l) => l !== sourceLang);
    onChange(allLangs);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Filter out source lang from available options
  const availableLangs = Object.keys(languageNames).filter(
    (l) => l !== sourceLang,
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-bold text-primary block mb-1">
        {t("targetLanguages")}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[200px] flex items-center justify-between p-2 bg-background border border-border rounded-lg text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="truncate">
          {targetLangs.length === 0
            ? t("selectLanguage")
            : t("countLangsSelected", { count: targetLangs.length })}
        </span>
        <ChevronsUpDown className="w-4 h-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full sm:w-64 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-border flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 flex-1"
            >
              {t("selectAll")}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 flex-1"
            >
              {t("clear")}
            </button>
          </div>
          <div className="p-1">
            {availableLangs.map((lang) => (
              <div
                key={lang}
                onClick={() => toggleLang(lang)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm"
              >
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                    targetLangs.includes(lang)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {targetLangs.includes(lang) && <Check className="w-3 h-3" />}
                </div>
                <span>
                  {languageNames[lang]} ({lang.toUpperCase()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
