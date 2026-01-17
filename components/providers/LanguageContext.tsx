"use client";

import { portfolioContent } from "@/config/contents";
import { ContentConfig, Language } from "@/types/contents";
import React, { createContext, useContext, useEffect, useState } from "react";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentConfig;
  t: (key: string) => string; // Simple helper if needed, but mostly we use content directly
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("tr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "tr" || saved === "en")) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    content: portfolioContent[language],
    t: (key: string) => key, // Placeholder, logically we use the structure
  };

  if (!mounted) {
    return null; // or a loader, to prevent hydration mismatch
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
