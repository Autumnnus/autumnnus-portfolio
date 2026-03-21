import {
  getAboutStats,
  getBlogPosts,
  getProfile,
  getProjects,
  getSkills,
  getSocialLinks,
  getWorkExperiences,
} from "@/app/actions";
import Container from "@/components/common/Container";
import SectionNav from "@/components/common/SectionNav";
import SeasonalEffects from "@/components/decorations/SeasonalEffects";
import About from "@/components/landing/About";
import FeaturedBlogs from "@/components/landing/FeaturedBlogs";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import GitHubCalendar from "@/components/landing/GitHubCalendar";
import Hero from "@/components/landing/Hero";
import WorkExperienceComponent from "@/components/landing/WorkExperience";
import { LanguageType as Language } from "@/lib/db/schema";
import { BlogPost, Project, WorkExperience } from "@/types/contents";
import { Metadata } from "next";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

const BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://kadir-topcu.autumnnus.dev"
).replace(/\/$/, "");

const GLOBAL_KEYWORDS = [
  "full stack developer",
  "pixel art portfolio",
  "Next.js developer",
  "React engineer",
  "TypeScript freelancer",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale as Language;
  const profileData = await getProfile(lang);
  const title = profileData
    ? `${profileData.title} • ${profileData.name}`
    : "Kadir | Full Stack Developer Portfolio";
  const description =
    profileData?.description ??
    "Kadir Autumnnus is a full stack developer whose pixel-art inspired portfolio surfaces projects, blogs, and work experiences.";
  const pageUrl = `${BASE_URL}/${locale}`;
  const imageUrl = `${BASE_URL}/images/autumn.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: GLOBAL_KEYWORDS,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Autumnnus Portfolio",
      type: "website",
      locale,
      images: [
        {
          url: imageUrl,
          alt: "Autumn sunrise pixel art inspired branding for Kadir's portfolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: profileData?.name,
    },
  };
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const lang = locale as Language;

  const [
    projectsResult,
    blogResult,
    profileData,
    experiencesData,
    aboutStats,
    skills,
    socialLinks,
  ] = await Promise.all([
    getProjects({
      lang,
      featured: true,
      limit: 4,
    }),
    getBlogPosts({
      lang,
      featured: true,
      limit: 2,
      skipAuth: true,
    }),
    getProfile(lang),
    getWorkExperiences(lang),
    getAboutStats(),
    getSkills(),
    getSocialLinks(),
  ]);

  const featuredProjects = (projectsResult.items as unknown as Project[]) || [];
  const featuredBlogs = (blogResult.items as unknown as BlogPost[]) || [];
  return (
    <>
      <SeasonalEffects />
      <SectionNav />
      <Container className="min-h-screen py-8">
        <Hero data={profileData} skills={skills} socialLinks={socialLinks} />
        <About data={profileData} stats={aboutStats} />
        <WorkExperienceComponent data={experiencesData as WorkExperience[]} />
        <GitHubCalendar />
        <FeaturedProjects projects={featuredProjects} />
        {featuredBlogs.length > 0 && <FeaturedBlogs posts={featuredBlogs} />}
      </Container>
    </>
  );
}
