"use client";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Link } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function AdminHeader() {
  const t = useTranslations("Admin.Header");
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/admin/projects", label: t("projects") },
    { href: "/admin/blog", label: t("blog") },
    { href: "/admin/experience", label: t("experience") },
    { href: "/admin/profile", label: t("profile") },
    { href: "/admin/embeddings", label: t("embeddings") },
    { href: "/admin/livechat", label: t("liveChat") },
    { href: "/admin/ai-logs", label: t("aiLogs") || "AI Logs" },
  ];

  const handleSignOut = () => signOut({ callbackUrl: `/${locale}` });

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-all"
          >
            <div className="p-2 bg-secondary/50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <Home className="w-5 h-5" />
            </div>
            <span className="hidden md:inline font-bold tracking-tight text-sm group-hover:text-primary transition-colors">
              {t("backToHome")}
            </span>
          </Link>
          <div className="w-px h-6 bg-border/50 hidden sm:block" />
          <span className="font-bold text-base sm:text-lg tracking-tight text-primary truncate max-w-[120px] sm:max-w-none">
            {t("title")}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-destructive/5 text-destructive rounded-xl font-bold text-xs hover:bg-destructive hover:text-white transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut")}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2.5 bg-secondary/50 hover:bg-secondary rounded-xl transition-all"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="xl:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center p-4 text-sm font-bold bg-muted/30 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all border border-border/50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
