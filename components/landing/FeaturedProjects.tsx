"use client";

import SectionHeading from "@/components/common/SectionHeading";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Project } from "@/types/contents";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const t = useTranslations("Projects");
  const { content } = useLanguage();

  // Use passed projects
  const featuredProjects = projects.slice(0, 4);

  return (
    <section className="py-12" id="projects">
      <SectionHeading subHeading={t("subTitle")} heading={t("title")} />

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
