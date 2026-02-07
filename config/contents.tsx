import { Language, PortfolioConfig } from "@/types/contents";
import { assets } from "../assets";

import { SKILLS, SOCIAL_LINKS } from "./data";
export { SKILLS, SOCIAL_LINKS };

const LANGUAGES: Language[] = [
  "tr",
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "ar",
  "zh",
];

const getBaseContent = (lang: Language) => {
  const isTr = lang === "tr";
  return {
    navbar: {
      items: isTr
        ? [
            { name: "Ana Sayfa", href: "/" },
            { name: "Projeler", href: "/projects" },
            { name: "Blog", href: "/blog" },
            { name: "Deneyim", href: "/work" },
          ]
        : [
            { name: "Home", href: "/" },
            { name: "Projects", href: "/projects" },
            { name: "Blog", href: "/blog" },
            { name: "Work", href: "/work" },
          ],
    },
    hero: {
      greetingText: isTr ? "Merhaba, ben " : "Hello, I'm ",
      name: "Kadir",
      title: "Full Stack Developer",
      avatar: assets.common.avatar,
      description: isTr
        ? "Sonbahar yaprakları gibi kod yazıyorum. Web uygulamaları geliştiriyor, kullanıcı deneyimlerini tasarlıyorum."
        : "I code like autumn leaves falling. Building web applications and designing user experiences.",
      skills: Object.values(SKILLS),
      buttons: [
        {
          text: isTr ? "Projelerim" : "My Projects",
          href: "#projects",
          variant: "primary" as const,
        },
        {
          text: "Blog",
          href: "/blog",
          variant: "secondary" as const,
        },
      ],
      socialLinks: Object.values(SOCIAL_LINKS),
    },
    about: {
      title: isTr ? "Hakkımda" : "About Me",
      description:
        "Ölçeklenebilir, kullanıcı odaklı uygulamalar geliştirmeye tutkulu bir Full-Stack Geliştiriciyim. Uzmanlığım, React, Zustand ve TypeScript ile frontend geliştirmenin yanı sıra Node.js, MongoDB ve Spring Boot ile backend sistemlerini kapsamaktadır.\n Mevcut rolümde, sezgisel kullanıcı arayüzü bileşenlerinden sağlam API servislerine kadar uçtan uca özellikler tasarlıyor ve uyguluyorum. Ayrıca OpenAI embedding'leri ve Pinecone'u entegre ederek daha akıllı arama ve bilgi yönetimi çözümleri sunan yapay zeka destekli modüllere katkıda bulundum.\n Temiz mimari prensipleriyle (SOLID, CQRS, Onion Architecture) çalışmaktan keyif alıyor ve sürekli olarak sürdürülebilir, yüksek kaliteli kod yazmayı hedefliyorum. Teknik becerilerin ötesinde, çevik (agile) ekipler içinde iş birliğine ve etkili problem çözmeye değer veriyorum.\n Şu anda, gelişen teknolojilere dair merakımı korurken, yapay zeka entegrasyonları ve ölçeklenebilir backend sistemleri konusundaki uzmanlığımı geliştiriyorum.",
      experienceLabel: isTr ? "Deneyim" : "Experience",
      projectCount: isTr ? "20+ Proje" : "20+ Projects",
      projectLabel: isTr ? "Proje" : "Projects",
      githubActivityTitle: isTr ? "Kodlama Aktivitesi" : "Coding Activity",
      avatar: assets.common.avatar,
    },
    projects: {
      title: isTr ? "Öne Çıkan Projeler" : "Featured Projects",
      description: isTr
        ? "Farklı teknolojiler ve alanlardaki projelerim ve çalışmalarım."
        : "My projects and work across different technologies and domains.",
      viewAllText: isTr ? "Tümünü Gör" : "View All",
      filterByStatusText: isTr ? "Duruma Göre Filtrele" : "Filter by Status",
      allProjectsText: isTr ? "Tüm Projeler" : "All Projects",
      projectCountText: isTr ? "proje" : "projects",
      noResultsText: isTr
        ? "Bu durumda proje bulunamadı."
        : "No projects found with this status.",
      backToProjectsText: isTr ? "Projelere Dön" : "Back to Projects",
      categoryLabel: isTr ? "Kategori" : "Category",
      statusLabel: isTr ? "Durum" : "Status",
      liveDemoText: isTr ? "Canlı Demo" : "Live Demo",
      sourceCodeText: isTr ? "Kaynak Kod" : "Source Code",
      nextProjectText: isTr ? "Sonraki Proje" : "Next Project",
      relatedProjectsText: isTr ? "İlgili Projeler" : "Related Projects",
    },
    blog: {
      title: isTr ? "Son Yazılar" : "Latest Posts",
      description: isTr
        ? "Mühendislik ve programlama üzerine düşünceler, rehberler ve içgörüler."
        : "Thoughts, tutorials, and insights on engineering, and programming.",
      viewAllText: isTr ? "Tümünü Oku" : "Read All",
      popularTagsText: isTr ? "Popüler Etiketler" : "Popular Tags",
      postCountText: isTr ? "yazı" : "posts",
      noResultsText: isTr ? "Henüz yazı bulunmuyor." : "No posts found.",
      backToBlogText: isTr ? "Bloga Dön" : "Back to Blog",
      commentsTitle: isTr ? "Yorumlar" : "Comments",
      signInToComment: isTr
        ? "Yorum yapmak için giriş yapın"
        : "Sign in to comment",
      joinConversation: isTr
        ? "Google hesabınızla giriş yaparak sohbete katılın"
        : "Join the conversation by signing in with your Google account",
      signInButton: isTr ? "Google ile Giriş Yap" : "Sign in with Google",
      signedInAs: isTr ? "Giriş yapıldı:" : "Signed in as",
      postComment: isTr ? "Yorum Paylaş" : "Post Comment",
      noCommentsYet: isTr
        ? "Henüz yorum yok. İlk yorumu siz yapın!"
        : "No comments yet. Be the first to comment!",
    },
    work: {
      title: isTr ? "Deneyimler" : "Experience",
      description: isTr
        ? "Farklı şirketler ve rollerdeki iş deneyimlerim."
        : "My work experiences across different companies and roles.",
      allExperiencesText: isTr ? "Tüm Deneyimler" : "All Experiences",
      experienceCountText: isTr ? "deneyim" : "experiences",
    },
    footer: {
      text: isTr
        ? "© 2026 Kadir. Tüm hakları saklıdır."
        : "© 2026 Kadir. All rights reserved.",
      socialLinks: [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.LINKEDIN],
    },
  };
};

export const portfolioContent: PortfolioConfig = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang] = getBaseContent(lang);
    return acc;
  },
  {} as PortfolioConfig,
);
