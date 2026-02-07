import Container from "@/components/common/Container";
import About from "@/components/landing/About";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import GitHubCalendar from "@/components/landing/GitHubCalendar";
import Hero from "@/components/landing/Hero";
import WorkExperienceComponent from "@/components/landing/WorkExperience";

import {
  getAboutStats,
  getProfile,
  getProjects,
  getWorkExperiences,
} from "@/app/actions";
import SectionNav from "@/components/common/SectionNav";
import { Project, WorkExperience } from "@/types/contents";
import { Language } from "@prisma/client";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const lang = locale as Language;

  const [projectsResult, profileData, experiencesData, aboutStats] =
    await Promise.all([
      getProjects({
        lang,
        featured: true,
        limit: 4,
      }),
      getProfile(lang),
      getWorkExperiences(lang),
      getAboutStats(),
    ]);

  const featuredProjects = (projectsResult.items as unknown as Project[]) || [];

  return (
    <>
      <SectionNav />
      <Container className="min-h-screen py-8">
        <Hero data={profileData} />
        <About data={profileData} stats={aboutStats} />
        <WorkExperienceComponent data={experiencesData as WorkExperience[]} />
        <GitHubCalendar />
        <FeaturedProjects projects={featuredProjects} />
      </Container>
    </>
  );
}
