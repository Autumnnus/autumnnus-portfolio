"use client";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Link } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import Container from "./Container";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const navItems = [
    { name: t("Home"), href: "/" },
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
            <span className="text-xl">KADIR.DEV</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pixel-btn-nav px-2 py-1 sm:px-3 sm:py-2 text-xs font-pixel uppercase tracking-wide text-foreground hover:text-primary hover:bg-secondary/20 transition-all border-2 border-transparent hover:border-border"
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <NextLink
                href="/admin"
                className="pixel-btn-nav px-2 py-1 sm:px-3 sm:py-2 text-xs font-pixel uppercase tracking-wide text-accent hover:text-primary hover:bg-secondary/20 transition-all border-2 border-accent/20 hover:border-accent"
              >
                Dashboard
              </NextLink>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </nav>
  );
}
