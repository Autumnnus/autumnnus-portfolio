import Container from "@/components/common/Container";
import About from "@/components/landing/About";
import FeaturedBlogs from "@/components/landing/FeaturedBlogs";
import FeaturedProjects from "@/components/landing/FeaturedProjects";
import Hero from "@/components/landing/Hero";

export default function Home() {
  return (
    <Container className="min-h-screen py-8">
      <Hero />
      <About />
      <FeaturedProjects />
      <FeaturedBlogs />
    </Container>
  );
}
