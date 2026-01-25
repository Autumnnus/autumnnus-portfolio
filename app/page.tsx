import Container from "@/components/common/Container";
import About from "@/components/landing/About";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import GitHubCalendar from "@/components/landing/GitHubCalendar";
import Hero from "@/components/landing/Hero";
import WorkExperience from "@/components/landing/WorkExperience";

import { getProjects } from "@/app/actions";
import SectionNav from "@/components/common/SectionNav";
import { Project } from "@/types/contents";
import { Language } from "@prisma/client";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  const allProjects = await getProjects(locale as Language);
  const featuredProjects = allProjects.filter(
    (p) => p.featured,
  ) as unknown as Project[];

  return (
    <>
      <SectionNav />
      <Container className="min-h-screen py-8">
        <Hero />
        <About />
        <WorkExperience />
        <GitHubCalendar />
        <FeaturedProjects projects={featuredProjects} />
        {/* <FeaturedBlogs /> */}
      </Container>
    </>
  );
}
