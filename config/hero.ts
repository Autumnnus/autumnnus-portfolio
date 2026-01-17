export const heroConfig = {
  name: "Kadir",
  title: "Full Stack Developer",
  avatar: "🍂",
  description:
    "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum.",
  skills: [
    { name: "TypeScript", emoji: "📘" },
    { name: "React", emoji: "⚛️" },
    { name: "Next.js", emoji: "▲" },
    { name: "Node.js", emoji: "🟢" },
    { name: "PostgreSQL", emoji: "🐘" },
  ],
  buttons: [
    { text: "Projelerim", href: "/projects", variant: "primary" as const },
    { text: "İletişim", href: "/contact", variant: "secondary" as const },
  ],
  socialLinks: [
    { name: "GitHub", href: "https://github.com", icon: "🐙" },
    { name: "LinkedIn", href: "https://linkedin.com", icon: "💼" },
    { name: "Twitter", href: "https://twitter.com", icon: "🐦" },
    { name: "Email", href: "mailto:hello@example.com", icon: "📧" },
  ],
};
