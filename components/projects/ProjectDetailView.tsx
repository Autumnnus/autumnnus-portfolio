"use client";

import Container from "@/components/common/Container";
import ContentRenderer from "@/components/common/ContentRenderer";
import FadeIn from "@/components/common/FadeIn";
import Icon from "@/components/common/Icon";
import RelatedProjectCard from "@/components/projects/RelatedProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";
import { GithubRepoStats, Project } from "@/types/contents";
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import ProjectImageCarousel from "@/components/projects/ProjectImageCarousel";

export default function ProjectDetailView({
  slug,
  githubStats,
}: {
  slug: string;
  githubStats?: GithubRepoStats | null;
}) {
  const { content } = useLanguage();
  const projects = useMemo(() => content.projects.items || [], [content]);

  const project = projects.find((p) => p.slug === slug);

  const { nextProject, relatedProjects } = useMemo(() => {
    if (!project) return { nextProject: null, relatedProjects: [] };

    const currentIndex = projects.findIndex((p) => p.slug === slug);
    const next =
      currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

    const related = projects
      .filter(
        (p) =>
          p.slug !== slug &&
          p.technologies.some((t) =>
            project.technologies.some((ft) => ft.name === t.name),
          ),
      )
      .slice(0, 2);

    return { nextProject: next, relatedProjects: related };
  }, [slug, projects, project]);

  if (!project) {
    return null;
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "Working":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Building":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "Archived":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
      default:
        return "bg-secondary/10 text-secondary border-secondary/20";
    }
  };

  const visibleTechs = project.technologies.slice(0, 4);
  const remainingCount = project.technologies.length - 4;

  return (
    <Container className="py-12 sm:py-20">
      {/* Back Button */}
      <FadeIn delay={0.1}>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {content.projects.backToProjectsText}
        </Link>
      </FadeIn>

      {/* Cover Image / Carousel */}
      <FadeIn delay={0.2}>
        <div className="mb-8">
          {project.images && project.images.length > 0 ? (
            <ProjectImageCarousel
              images={project.images}
              title={project.title}
            />
          ) : project.coverImage ? (
            <div className="relative w-full aspect-video lg:aspect-21/9 bg-muted rounded-lg overflow-hidden shadow-xl">
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-linear-to-br from-pink-400 via-purple-500 to-indigo-600 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-lg shadow-2xl flex items-center justify-center">
                  <div className="text-6xl sm:text-8xl opacity-50">
                    <Icon
                      src={project.technologies[0]?.icon}
                      alt="icon"
                      size={80}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </FadeIn>
      {/* Tags and Status */}
      <FadeIn delay={0.3}>
        <div className="flex flex-wrap gap-2 mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
              project.status,
            )}`}
          >
            {project.status}
          </span>
          {visibleTechs.map((tech) => (
            <Badge key={tech.name} variant="outline">
              {tech.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="outline">+{remainingCount} more</Badge>
          )}
        </div>
      </FadeIn>
      {/* Title and Short Description */}
      <FadeIn delay={0.4}>
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            {project.title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {project.shortDescription}
          </p>
        </div>
      </FadeIn>
      {/* Project Info Grid */}
      <FadeIn delay={0.5}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {content.projects.categoryLabel}
            </p>
            <p className="text-base font-medium">{project.category}</p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {content.projects.statusLabel}
            </p>
            <p className="text-base font-medium">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  project.status,
                )}`}
              >
                {project.status}
              </span>
            </p>
          </div>

          {githubStats && (
            <>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  GitHub Stats
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1" title="Stars">
                    <span className="text-yellow-500">★</span>
                    {githubStats.stars}
                  </span>
                  <span className="flex items-center gap-1" title="Forks">
                    <span className="text-blue-500">⑂</span>
                    {githubStats.forks}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </p>
                <p className="text-sm font-medium">
                  {new Date(githubStats.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-medium">
                  {new Date(githubStats.pushedAt).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </div>
      </FadeIn>
      {/* Action Buttons */}
      <FadeIn delay={0.6}>
        <div className="flex flex-wrap gap-3 mb-12">
          {project.liveDemo && (
            <a
              href={project.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              {content.projects.liveDemoText}
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-md font-medium hover:bg-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              {content.projects.sourceCodeText}
            </a>
          )}
        </div>
      </FadeIn>
      {/* Full Description */}
      <FadeIn delay={0.7}>
        <div className="mb-12">
          <ContentRenderer content={project.fullDescription} />
        </div>
      </FadeIn>
      {/* Next Project */}
      {nextProject && (
        <FadeIn delay={0.8}>
          <Link
            href={`/projects/${nextProject.slug}`}
            className="block mb-12 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {content.projects.nextProjectText}
                </p>
                <p className="text-lg font-bold group-hover:text-primary transition-colors">
                  {nextProject.title}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </FadeIn>
      )}
      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />
      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <FadeIn delay={0.9}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              {content.projects.relatedProjectsText}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {relatedProjects.map((relatedProject, index) => (
                <RelatedProjectCard
                  key={relatedProject.slug}
                  project={relatedProject}
                  index={index}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}
      {/* View All Projects Button */}
      <FadeIn delay={1.0}>
        <div className="text-center pt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            {content.projects.viewAllText}
          </Link>
        </div>
      </FadeIn>
    </Container>
  );
}
