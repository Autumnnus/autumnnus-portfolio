"use client";

import Icon from "@/components/common/Icon";
import PixelIcon from "@/components/pixel/PixelIcon";
import Reveal from "@/components/pixel/Reveal";
import { cn, formatDate } from "@/lib/utils";
import { Project } from "@/types/contents";
import { ExternalLink, Github } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const STATUS_STYLE: Record<Project["status"], string> = {
  Completed: "bg-moss text-moss-foreground",
  Working: "bg-primary text-primary-foreground",
  Building: "bg-gold text-px-ink",
  Archived: "bg-muted text-muted-foreground",
};

const MAX_TECHS = 6;

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const t = useTranslations("Common");
  const tProjects = useTranslations("Projects");
  const locale = useLocale();
  const featured = Boolean(project.featured);
  const href = `/projects/${project.slug}`;
  const techs = project.technologies.slice(0, MAX_TECHS);
  const extra = project.technologies.length - techs.length;
  const mainTech = project.technologies[0];

  return (
    <Reveal delay={(index % 2) * 110} className="h-full p-2">
      <article
        className={cn(
          "group relative flex h-full flex-col transition-transform duration-100 hover:-translate-y-1",
          featured ? "pixel-panel-featured" : "pixel-panel",
        )}
      >
        <Link
          href={href}
          title={project.title}
          className="card-shine relative block h-48 overflow-hidden border-b-4 border-px-ink bg-slot sm:h-52"
        >
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="card-pattern flex h-full items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center bg-card pixel-frame">
                {mainTech?.icon ? (
                  <Icon src={mainTech.icon} alt={tProjects("mainTechAlt")} size={34} />
                ) : (
                  <PixelIcon name="gem" className="h-8 w-8 text-primary" />
                )}
              </span>
            </span>
          )}

          {featured && (
            <>
              <span className="absolute left-3 top-3 bg-primary px-2 py-1 font-pixel text-sm font-semibold text-primary-foreground pixel-frame-sm">
                {tProjects("featured")}
              </span>
              <span className="card-star absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-gold text-px-ink pixel-frame-sm">
                <PixelIcon name="star" className="h-5 w-5" />
              </span>
            </>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-3.5 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-pixel text-2xl leading-tight font-bold transition-colors duration-100 group-hover:text-ember">
              <Link href={href}>{project.title}</Link>
            </h3>
            <div className="flex shrink-0 gap-3 p-[3px]">
              {project.liveDemo && (
                <a
                  href={project.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tProjects("liveDemo")}
                  title={tProjects("liveDemo")}
                  className="flex h-8 w-8 items-center justify-center bg-slot transition-colors duration-100 pixel-frame-sm hover:bg-primary hover:text-primary-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tProjects("sourceCode")}
                  title={tProjects("sourceCode")}
                  className="flex h-8 w-8 items-center justify-center bg-slot transition-colors duration-100 pixel-frame-sm hover:bg-primary hover:text-primary-foreground"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.shortDescription}
          </p>

          <ul className="flex flex-wrap gap-2 p-[2px]" aria-label={t("technologies")}>
            {techs.map((tech) => (
              <li
                key={tech.name}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium pixel-chip"
              >
                {tech.icon && <Icon src={tech.icon} alt="" size={14} />}
                {tech.name}
              </li>
            ))}
            {extra > 0 && (
              <li className="px-2 py-1 text-xs font-medium pixel-chip">+{extra}</li>
            )}
          </ul>

          <div className="mt-auto flex items-center justify-between gap-3 border-t-4 border-dashed border-slot pt-3.5">
            <div className="flex items-center gap-3">
              <span
                className={cn("px-2 py-1 font-pixel text-sm", STATUS_STYLE[project.status])}
              >
                {tProjects(`statusLabels.${project.status}`)}
              </span>
              <time className="font-pixel text-xs text-muted-foreground">
                {formatDate(project.createdAt, undefined, locale)}
              </time>
            </div>
            <Link
              href={href}
              className="flex items-center gap-2 font-pixel text-base font-semibold text-ember"
            >
              {t("details")}
              <PixelIcon
                name="arrowSmall"
                className="h-2.5 w-1.5 transition-transform duration-100 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
