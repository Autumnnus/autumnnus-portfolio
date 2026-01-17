"use client";

import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button"; // Assuming shadcn button generic

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
      className="rounded-full w-10 h-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      aria-label="Toggle Language"
    >
      <span className="text-sm font-bold flex items-center gap-1">
        {language.toUpperCase()}
      </span>
    </Button>
  );
}
