import Container from "@/components/common/Container";
import About from "@/components/landing/About";
import FeaturedBlogs from "@/components/landing/FeaturedBlogs";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import GitHubCalendar from "@/components/landing/GitHubCalendar";
import Hero from "@/components/landing/Hero";
import WorkExperienceComponent from "@/components/landing/WorkExperience";

import {
  getAboutStats,
  getBlogPosts,
  getProfile,
  getProjects,
  getSkills,
  getSocialLinks,
  getWorkExperiences,
} from "@/app/actions";
import SectionNav from "@/components/common/SectionNav";
import { BlogPost, Project, WorkExperience } from "@/types/contents";
import { Language } from "@prisma/client";

interface HomeProps {
  params: Promise<{ locale: string }>;
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
