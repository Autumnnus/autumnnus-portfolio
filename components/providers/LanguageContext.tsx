"use client";

import { portfolioContent } from "@/config/contents";
import { ContentConfig, Language } from "@/types/contents";
import React, { createContext, useContext } from "react";

interface LanguageContextType {
  language: Language;
  content: ContentConfig;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Language;
}) {
  const value = {
    language: locale,
    content:
      (portfolioContent as Record<string, ContentConfig>)[locale] ||
      portfolioContent.tr,
  };

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
