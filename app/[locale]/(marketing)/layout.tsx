import { getProfile, getSocialLinks } from "@/app/actions";
import LiveChat from "@/components/chat/LiveChat";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { LanguageType as Language } from "@/lib/db/schema";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://kadir-topcu.autumnnus.dev"
).replace(/\/$/, "");

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale as Language;
  const [profileData, socialLinks] = await Promise.all([
    getProfile(lang),
    getSocialLinks(),
  ]);
  const profileUrl = `${BASE_URL}/${locale}`;
  const socialUrls = [
    profileData?.github,
    profileData?.linkedin,
    ...socialLinks.map((link) => link.href),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim());
  const uniqueSocialUrls = Array.from(new Set(socialUrls));
  const heroImage =
    profileData?.avatar &&
    (profileData.avatar.startsWith("http")
      ? profileData.avatar
      : `${BASE_URL}${profileData.avatar}`);
  const description =
    profileData?.description ||
    "Autumnnus is a pixel art themed full stack developer portfolio by Kadir.";
  const graph = [
    profileData && {
      "@type": "Person",
      name: profileData.name,
      url: profileUrl,
      image: heroImage,
      jobTitle: profileData.title,
      description,
      email: profileData.email,
      sameAs: uniqueSocialUrls.length ? uniqueSocialUrls : undefined,
    },
    {
      "@type": "WebSite",
      url: BASE_URL,
      name: profileData?.title ?? "Autumnnus Portfolio",
      description,
      inLanguage: locale,
      sameAs: uniqueSocialUrls.length ? uniqueSocialUrls : undefined,
    },
  ].filter(Boolean) as Record<string, unknown>[];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": graph,
  };
  return (
    <>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <SmoothScroll>
        <TooltipProvider delayDuration={0}>
          <div className="marketing-gradient-surface relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <LiveChat />
            <Footer locale={locale} />
          </div>
        </TooltipProvider>
      </SmoothScroll>
    </>
  );
}
