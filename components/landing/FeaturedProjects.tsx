import SectionHeading from "@/components/common/SectionHeading";
import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/config/projects";
import Link from "next/link";

export default function FeaturedProjects() {
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);

  return (
    <section className="py-12">
      <SectionHeading subHeading="Öne Çıkanlar" heading="Projelerim" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/projects" className="pixel-btn">
          Tüm Projeleri Gör →
        </Link>
      </div>
    </section>
  );
}
