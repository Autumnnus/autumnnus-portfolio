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
  const [state, setState] = useState<{
    language: Language;
    mounted: boolean;
  }>({
    language: "tr",
    mounted: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    const initialLang = saved === "tr" || saved === "en" ? saved : "tr";

    document.cookie = `NEXT_LOCALE=${initialLang}; path=/; max-age=31536000`;

    const timer = setTimeout(() => {
      setState({
        language: initialLang,
        mounted: true,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
    localStorage.setItem("language", lang);
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
  };

  const { language, mounted } = state;

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
