"use client";

import Icon from "@/components/common/Icon";
import { formatDate } from "@/lib/utils";
import { Project } from "@/types/contents";
import { motion } from "framer-motion";
import { Calendar, ExternalLink, Github } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const tProjects = useTranslations("Projects");
  const isFeatured = Boolean(project.featured);
  const featuredCardClasses =
    "border-amber-700/60 dark:border-amber-300/70 bg-linear-to-br from-amber-900/10 via-card to-yellow-900/10 dark:from-amber-950/10 dark:to-yellow-950/10 shadow-[0_0_0_1px_rgba(180,83,9,0.18),0_0_24px_rgba(180,83,9,0.1)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_32px_rgba(251,191,36,0.12)] hover:border-amber-600/80 dark:hover:border-amber-100/90 hover:shadow-[0_0_0_1px_rgba(180,83,9,0.28),0_0_32px_rgba(180,83,9,0.16)] dark:hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_42px_rgba(251,191,36,0.2)]";
  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "Working":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "Building":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "Archived":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return "✅";
      case "Working":
        return "🛠️";
      case "Building":
        return "🏗️";
      case "Archived":
        return "📦";
      default:
        return null;
    }
  };

  const visibleTechs = project.technologies.slice(0, 7);
  const remainingCount = project.technologies.length - 7;
  const { resolvedTheme } = useTheme();
  const isWinter = resolvedTheme === "dark";
  const seasonalGradient = isWinter
    ? "bg-linear-to-br from-slate-900 via-blue-950 to-slate-900"
    : "bg-linear-to-br from-orange-50 via-amber-100 to-orange-50";

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`group relative flex h-[34rem] sm:h-[36rem] flex-col bg-card border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isFeatured ? featuredCardClasses : "border-border"
      }`}
    >
      {isFeatured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-lg"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.12),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(120,53,15,0.14),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,236,179,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(120,53,15,0.16),_transparent_28%)]" />
          <div className="absolute inset-[6px] rounded-[13px] border border-amber-700/25 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.12)] dark:border-amber-100/30 dark:shadow-[inset_0_0_0_1px_rgba(255,248,220,0.18)]" />
          <div className="absolute inset-[12px] rounded-[10px] border border-amber-700/15 dark:border-amber-200/15" />
          <div className="absolute left-1/2 top-[7px] h-7 w-20 -translate-x-1/2 rounded-b-[1rem] border-x border-b border-amber-700/45 bg-linear-to-b from-amber-700/10 to-transparent dark:border-amber-100/45 dark:from-amber-100/20" />
          <div className="absolute left-1/2 top-[5px] flex -translate-x-1/2 items-center gap-1.5">
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/80 dark:bg-amber-200 dark:shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
            <span className="h-2.5 w-2.5 rounded-full border border-amber-800/70 bg-gradient-to-b from-amber-200 to-amber-600 dark:border-amber-50/80 dark:from-amber-50 dark:to-amber-300 dark:shadow-[0_0_16px_rgba(251,191,36,0.9)]" />
            <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/80 dark:bg-amber-200 dark:shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
          </div>
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-700/90 to-transparent dark:via-amber-100" />
          <div className="absolute inset-x-8 top-5 h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent dark:via-amber-200/70" />
          <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-700/60 to-transparent dark:via-amber-200/60" />
          <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-lg border-l border-t border-amber-700/75 dark:border-amber-100/75" />
          <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-lg border-r border-t border-amber-700/75 dark:border-amber-100/75" />
          <div className="absolute left-0 bottom-0 h-12 w-12 rounded-bl-lg border-l border-b border-amber-700/50 dark:border-amber-200/55" />
          <div className="absolute right-0 bottom-0 h-12 w-12 rounded-br-lg border-r border-b border-amber-700/50 dark:border-amber-200/55" />
          <div className="absolute left-3 top-10 bottom-14 w-px bg-gradient-to-b from-transparent via-amber-700/55 to-transparent dark:via-amber-200/60" />
          <div className="absolute right-3 top-10 bottom-14 w-px bg-gradient-to-b from-transparent via-amber-700/55 to-transparent dark:via-amber-200/60" />
          <div className="absolute left-1/2 bottom-2 flex -translate-x-1/2 items-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-amber-700/80 dark:to-amber-200/80" />
            <span className="h-2 w-2 rotate-45 rounded-[2px] border border-amber-800/70 bg-amber-600/90 dark:border-amber-50/70 dark:bg-amber-200/90" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-700/80 dark:to-amber-200/80" />
          </div>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col">
        {/* Cover Image with Gradient */}
        <div
          className={`relative w-full h-48 sm:h-56 ${seasonalGradient} overflow-hidden flex items-center justify-center`}
        >
          {project.coverImage ? (
            <>
              <Image
                src={project.coverImage}
                alt={project.title}
                title={project.title}
                fill
                unoptimized
                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </>
          ) : (
            /* Premium Fallback UI */
            <div className="relative w-full h-full flex items-center justify-center p-6">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 -left-4 w-24 h-24 bg-primary rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 -right-4 w-24 h-24 bg-orange-500 rounded-full blur-3xl animate-pulse delay-700" />
              </div>

              <div className="relative z-10 w-full max-w-[240px] aspect-video bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-xl shadow-2xl flex flex-col items-center justify-center group-hover:scale-105 group-hover:-rotate-1 transition-all duration-500">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 dark:bg-white/5 mb-3 shadow-inner">
                  {project.technologies[0]?.icon ? (
                    <Icon
                      src={project.technologies[0].icon}
                      alt={tProjects("mainTechAlt")}
                      size={32}
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/20 animate-pulse" />
                  )}
                </div>
                <div className="w-24 h-1.5 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-primary/40 rounded-full animate-progress" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5 sm:p-6 space-y-4">
          {/* Title and Links */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors flex-1">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {project.liveDemo && (
                <a
                  href={project.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm line-clamp-2">
            {project.shortDescription}
          </p>

          {/* Technologies */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("technologies")}
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleTechs.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs"
                >
                  {tech.icon && (
                    <Icon src={tech.icon} alt={tech.name} size={14} />
                  )}
                  <span>{tech.name}</span>
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="px-2 py-1 bg-muted rounded text-xs font-medium">
                  +{remainingCount}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  project.status,
                )}`}
              >
                <span>{getStatusIcon(project.status)}</span>
                {tProjects(`statusLabels.${project.status}`)}
              </span>
            </div>

            <Link
              href={`/projects/${project.slug}`}
              title={project.title}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {t("details")}
              <span>→</span>
            </Link>
          </div>

          {/* Dates */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 pt-1">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(project.createdAt, undefined, locale)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
