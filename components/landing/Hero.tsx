"use client";
import Icon from "@/components/common/Icon";
import { Skill, SocialLink } from "@/lib/db/schema";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface HeroData {
  greetingText?: string;
  name?: string;
  title?: string;
  description?: string;
}

export default function Hero({
  data,
  skills = [],
  socialLinks = [],
}: {
  data?: HeroData | null;
  skills?: Skill[];
  socialLinks?: SocialLink[];
}) {
  const t = useTranslations("Hero");
  const tNav = useTranslations("Navbar");

  const name = "Kadir";
  const title = "Full Stack Developer";
  const buttons = [
    {
      text: t("buttons.projects"),
      href: "#projects",
      variant: "primary" as const,
    },
    {
      text: tNav("Blog"),
      href: "/blog",
      variant: "secondary" as const,
    },
  ];

  const description = data?.description || t("description");
  const greeting = data?.greetingText || t("greeting");
  const displayName = data?.name || name;
  const displayTitle = data?.title || title;

  return (
    <section id="hero" className="py-12 sm:py-16 animate-pixel-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 leading-tight">
            {greeting} <span className="text-primary">{displayName}</span>
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
            {displayTitle}
          </p>
        </div>
      </div>

      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className="pixel-border-sm px-2 py-1 sm:px-3 sm:py-1 bg-secondary/30 text-[10px] sm:text-xs flex items-center gap-2"
          >
            <Icon src={skill.icon} alt={skill.name} size={14} />
            <span>{skill.name}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {buttons.map((button) => (
          <Link
            key={button.href}
            href={button.href}
            className={`${
              button.variant === "primary" ? "pixel-btn-primary" : "pixel-btn"
            } text-[10px] sm:text-xs px-4 py-2 sm:px-6 sm:py-3`}
          >
            {button.text}
          </Link>
        ))}
      </div>

      <div className="flex gap-4 mb-8 sm:mb-12">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl sm:text-2xl hover:scale-110 transition-transform pixel-border-sm p-2 bg-card hover:bg-secondary/20 block ring-accent/20 hover:ring-2"
            title={link.name}
          >
            <Icon src={link.icon} alt={link.name} size={24} />
          </a>
        ))}
      </div>
    </section>
  );
}
