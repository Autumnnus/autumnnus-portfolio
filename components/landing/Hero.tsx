import { heroConfig } from "@/config/hero";
import Link from "next/link";

export default function Hero() {
  const { name, title, avatar, description, skills, buttons, socialLinks } =
    heroConfig;

  return (
    <section className="py-16 animate-pixel-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-6xl pixel-border p-4 bg-card">{avatar}</div>
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Merhaba, ben <span className="text-primary">{name}</span>
          </h1>
          <p className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
        </div>
      </div>

      <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className="pixel-border-sm px-3 py-1 bg-secondary/30 text-sm flex items-center gap-2"
          >
            <span>{skill.emoji}</span>
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
            className="text-2xl hover:scale-110 transition-transform pixel-border-sm p-2 bg-card hover:bg-secondary/20"
            title={link.name}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </section>
  );
}
