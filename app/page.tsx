import Container from "@/components/common/Container";
import About from "@/components/landing/About";
import FeaturedBlogs from "@/components/landing/FeaturedBlogs";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import GitHubCalendar from "@/components/landing/GitHubCalendar";
import Hero from "@/components/landing/Hero";
import WorkExperience from "@/components/landing/WorkExperience";

import SectionNav from "@/components/common/SectionNav";

export default function Home() {
  return (
    <>
      <SectionNav />
      <Container className="min-h-screen py-8">
        <Hero />
        <About />
        <WorkExperience />
        <FeaturedProjects />
        <GitHubCalendar />
        <FeaturedBlogs />
      </Container>
    </>
  );
}
