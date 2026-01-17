"use client";

import Icon from "@/components/common/Icon";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const { content } = useLanguage();
  const t = useTranslations("Hero");

  const { name, title, avatar, skills, buttons, socialLinks } = content.hero;

  return (
    <section id="hero" className="py-16 animate-pixel-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-6xl pixel-border p-4 bg-card relative w-24 h-24 flex items-center justify-center">
          {/* If avatar is an image path */}
          {avatar.startsWith("/") || avatar.startsWith("http") ? (
            <Image src={avatar} alt={name} fill className="object-cover p-2" />
          ) : (
            <span>{avatar}</span>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {t("greeting")} <span className="text-primary">{name}</span>
          </h1>
          <p className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
        </div>
      </div>

      <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
        {t("description")}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className="pixel-border-sm px-3 py-1 bg-secondary/30 text-sm flex items-center gap-2"
          >
            <Icon src={skill.icon} alt={skill.name} size={16} />
            <span>{skill.name}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {buttons.map((button) => (
          <Link
            key={button.href}
            href={button.href}
            className={
              button.variant === "primary" ? "pixel-btn-primary" : "pixel-btn"
            }
          >
            {button.text}
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl hover:scale-110 transition-transform pixel-border-sm p-2 bg-card hover:bg-secondary/20 block"
            title={link.name}
          >
            <Icon src={link.icon} alt={link.name} size={24} />
          </a>
        ))}
      </div>
    </section>
  );
}
