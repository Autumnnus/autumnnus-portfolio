"use client";

import { useLanguage } from "@/components/providers/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const sections = [
  { id: "hero", key: "home" },
  { id: "about", key: "about" },
  { id: "work", key: "work" },
  { id: "projects", key: "projects" },
  { id: "github", key: "github" },
  { id: "blog", key: "blog" },
];

export default function SectionNav() {
  const { content, language } = useLanguage();
  const [activeSection, setActiveSection] = useState("hero");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const getTitle = (key: string) => {
    switch (key) {
      case "home":
        return language === "tr" ? "Ana Sayfa" : "Home";
      case "about":
        return content.about.title;
      case "work":
        return content.work.title;
      case "projects":
        return content.projects.title;
      case "github":
        return content.about.githubActivityTitle;
      case "blog":
        return content.blog.title;
      default:
        return "";
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Adjust for header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4 items-end">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        const isHovered = hoveredSection === section.id;
        const title = getTitle(section.key);

        return (
          <div
            key={section.id}
            className="relative flex items-center group"
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <AnimatePresence mode="wait">
              {(isHovered || isActive) && (
                <motion.span
                  initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  className={`mr-4 px-3 py-1.5 rounded-md text-[10px] font-pixel uppercase tracking-[0.2em] whitespace-nowrap shadow-xl border backdrop-blur-md pointer-events-none ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                      : "bg-background/90 text-foreground border-border shadow-black/10"
                  }`}
                >
                  {title}
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={() => scrollToSection(section.id)}
              className="relative w-4 h-4 flex items-center justify-center group"
              aria-label={`Scroll to ${title}`}
            >
              {/* Outer Glow for Active */}
              {isActive && (
                <motion.div
                  layoutId="active-glow"
                  className="absolute inset-[-6px] bg-primary/30 blur-md rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* The Dot (Diamond Shape) */}
              <div
                className={`w-2.5 h-2.5 rotate-45 transition-all duration-500 ease-out border ${
                  isActive
                    ? "bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                    : "bg-transparent border-muted-foreground group-hover:border-primary group-hover:scale-110 group-hover:bg-primary/10"
                }`}
              />

              {/* Connecting Line (Optional, subtle) */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute -left-1 w-0.5 h-6 bg-primary/40 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
