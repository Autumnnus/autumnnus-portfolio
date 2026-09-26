"use client";

import SectionHeading from "@/components/common/SectionHeading";
import PixelIcon from "@/components/pixel/PixelIcon";
import ProjectCard from "@/components/projects/ProjectCard";
import { Project } from "@/types/contents";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const t = useTranslations("Projects");

  const featuredProjects = projects.slice(0, 4);

  return (
    <section className="relative z-10 py-16" id="projects">
      <SectionHeading
        subHeading={t("subTitle")}
        heading={t("title")}
        icon="gem"
        action={
          <Link href="/projects" className="pixel-button pixel-button-sm">
            {t("viewAll")}
            <PixelIcon name="arrowSmall" className="h-2.5 w-1.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featuredProjects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
