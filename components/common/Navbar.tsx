"use client";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import PixelIcon from "@/components/pixel/PixelIcon";
import SeasonSwitch from "@/components/pixel/SeasonSwitch";
import SoundToggle from "@/components/pixel/SoundToggle";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { useState } from "react";
import Container from "./Container";

const LOGO_PALETTE = { v: "var(--ember)", s: "var(--px-ink)" };

export default function Navbar() {
  const t = useTranslations("Navbar");
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: t("Home"), href: "/" },
    { name: t("Projects"), href: "/projects" },
    { name: t("Blog"), href: "/blog" },
    { name: t("Work"), href: "/work" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const links = (mobile: boolean) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          onClick={() => setIsMenuOpen(false)}
          className={cn("pixel-tab", mobile && "w-full justify-center")}
        >
          {item.name}
        </Link>
      ))}
      {isAdmin && (
        <NextLink
          href="/admin"
          onClick={() => setIsMenuOpen(false)}
          className={cn(
            "pixel-tab text-ember",
            mobile && "w-full justify-center",
          )}
        >
          {t("Dashboard")}
        </NextLink>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-px-ink bg-card">
      <Container className="flex h-[72px] max-w-6xl items-center justify-between gap-6 lg:h-[88px]">
        <Link href="/" className="flex items-center gap-3.5">
          <PixelIcon
            name="leaf"
            palette={LOGO_PALETTE}
            className="h-8 w-8 text-primary"
          />
          <span className="font-pixel text-2xl font-bold tracking-wide">
            KADIR.DEV
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <div className="flex gap-2.5">{links(false)}</div>
          <div className="flex items-center gap-5 p-1">
            <SeasonSwitch />
            <SoundToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? t("menuClose") : t("menuOpen")}
          className="pixel-button pixel-button-sm pixel-button-icon lg:hidden"
        >
          <PixelIcon name={isMenuOpen ? "close" : "menu"} className="h-4 w-4" />
        </button>
      </Container>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: "linear" }}
            className="border-t-4 border-px-ink bg-card lg:hidden"
          >
            <Container className="flex flex-col items-center gap-6 py-8">
              <div className="flex w-full max-w-xs flex-col gap-3 p-1">
                {links(true)}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-5 p-1">
                <SeasonSwitch />
                <SoundToggle />
                <LanguageSwitcher />
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
