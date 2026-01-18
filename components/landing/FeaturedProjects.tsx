"use client";

import SectionHeading from "@/components/common/SectionHeading";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import Link from "next/link";

export default function FeaturedProjects() {
  const { content } = useLanguage();
  const featuredProjects = (content.projects.items || [])
    .filter((p) => p.featured)
    .slice(0, 4);

  return (
    <section className="py-12" id="projects">
      <SectionHeading
        subHeading={content.projects.viewAllText}
        heading={content.projects.title}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {featuredProjects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/projects" className="pixel-btn">
          {content.projects.viewAllText} →
        </Link>
      </div>
    </section>
  );
}
