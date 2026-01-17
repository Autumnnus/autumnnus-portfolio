"use client";

import { portfolioContent } from "@/config/contents";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { ContentConfig, Language } from "@/types/contents";
import { NextIntlClientProvider } from "next-intl";
import React, { createContext, useContext, useEffect, useState } from "react";

const messages = { tr, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentConfig;
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
      setLanguage((prev) => (prev !== saved ? saved : prev));
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
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider
        locale={language}
        messages={messages[language]}
        timeZone="Europe/Istanbul"
      >
        {children}
      </NextIntlClientProvider>
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
