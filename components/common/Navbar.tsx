"use client";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Link } from "@/i18n/routing";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { useState } from "react";
import Container from "./Container";

interface NavLinksProps {
  navItems: { name: string; href: string }[];
  isAdmin: boolean;
  setIsMenuOpen: (open: boolean) => void;
  mobile?: boolean;
}

const NavLinks = ({
  navItems,
  isAdmin,
  setIsMenuOpen,
  mobile = false,
}: NavLinksProps) => (
  <>
    {navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => mobile && setIsMenuOpen(false)}
        className={`pixel-btn-nav uppercase tracking-wide text-foreground hover:text-primary hover:bg-secondary/20 transition-all border-2 border-transparent hover:border-border font-pixel ${
          mobile
            ? "text-lg py-4 w-full text-center"
            : "px-2 py-1 sm:px-3 sm:py-2 text-xs"
        }`}
      >
        {item.name}
      </Link>
    ))}
    {isAdmin && (
      <NextLink
        href="/admin"
        onClick={() => mobile && setIsMenuOpen(false)}
        className={`pixel-btn-nav uppercase tracking-wide text-accent hover:text-primary hover:bg-secondary/20 transition-all border-2 border-accent/20 hover:border-accent font-pixel ${
          mobile
            ? "text-lg py-4 w-full text-center"
            : "px-2 py-1 sm:px-3 sm:py-2 text-xs"
        }`}
      >
        DASHBOARD
      </NextLink>
    )}
  </>
);

export default function Navbar() {
  const t = useTranslations("Navbar");
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: t("Projects"), href: "/projects" },
    { name: t("Blog"), href: "/blog" },
    { name: t("Work"), href: "/work" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-4 border-border">
      <Container className="py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-pixel text-primary hover:text-accent transition-colors flex items-center gap-2 uppercase tracking-widest"
          >
            <span className="text-lg sm:text-xl">KADIR.DEV</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavLinks
              navItems={navItems}
              isAdmin={isAdmin}
              setIsMenuOpen={setIsMenuOpen}
            />
            <div className="h-6 w-1 bg-border mx-2" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="pixel-btn p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden border-t-4 border-border bg-background"
          >
            <Container className="py-8 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4 w-full">
                <NavLinks
                  navItems={navItems}
                  isAdmin={isAdmin}
                  setIsMenuOpen={setIsMenuOpen}
                  mobile
                />
              </div>
              <div className="h-1 w-full bg-border max-w-[200px]" />
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
