export interface WorkExperience {
  company: string;
  position: string;
  period: string;
  description: string;
  technologies: string[];
  emoji: string;
  current?: boolean;
}

export const workExperiences: WorkExperience[] = [
  {
    company: "Tech Startup",
    position: "Senior Full Stack Developer",
    period: "2024 - Şu an",
    description:
      "Ürün geliştirme ekibinde liderlik yaparak, mikroservis mimarisi ile ölçeklenebilir uygulamalar geliştiriyorum.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Docker"],
    emoji: "🚀",
    current: true,
  },
  {
    company: "Yazılım Ajansı",
    position: "Full Stack Developer",
    period: "2022 - 2024",
    description:
      "Çeşitli sektörlerden müşteriler için web uygulamaları ve e-ticaret platformları geliştirdim.",
    technologies: ["React", "Node.js", "MongoDB", "AWS"],
    emoji: "💼",
  },
  {
    company: "Dijital Ajans",
    position: "Frontend Developer",
    period: "2020 - 2022",
    description:
      "Responsive web siteleri ve interaktif kullanıcı arayüzleri tasarladım ve geliştirdim.",
    technologies: ["React", "Vue.js", "SCSS", "Tailwind CSS"],
    emoji: "🎨",
  },
  {
    company: "Freelance",
    position: "Web Developer",
    period: "2018 - 2020",
    description:
      "Küçük işletmeler için web siteleri ve landing page'ler oluşturdum.",
    technologies: ["HTML", "CSS", "JavaScript", "WordPress"],
    emoji: "🌱",
  },
];
