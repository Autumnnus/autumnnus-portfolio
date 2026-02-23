"use client";

import Container from "@/components/common/Container";
import ContentRenderer from "@/components/common/ContentRenderer";
import FadeIn from "@/components/common/FadeIn";
import Icon from "@/components/common/Icon";
import RelatedProjectCard from "@/components/projects/RelatedProjectCard";
import { GithubRepoStats, Project } from "@/types/contents";
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

import CommentSection from "@/components/interactive/CommentSection";
import LikeButton from "@/components/interactive/LikeButton";
import ViewCounter from "@/components/interactive/ViewCounter";
import ProjectImageCarousel from "@/components/projects/ProjectImageCarousel";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/badge";

export default function ProjectDetailView({
  project,
  githubStats,
  relatedProjects = [],
}: {
  project: Project;
  githubStats?: GithubRepoStats | null;
  relatedProjects?: Project[];
}) {
  const t = useTranslations("Projects");
  const tCommon = useTranslations("Common");
  const { resolvedTheme } = useTheme();

  const isWinter = resolvedTheme === "dark";
  const seasonalGradient = isWinter
    ? "bg-linear-to-br from-slate-900 via-blue-950 to-slate-900"
    : "bg-linear-to-br from-orange-50 via-amber-100 to-orange-50";

  // Note: For now, nextProject and relatedProjects will be empty or handled via simplified logic
  // since we shifted to backend-only fetching for the main project.
  const nextProject = null as Project | null;

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
          {t("back")}
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
                unoptimized
                className="object-cover"
                priority
              />
            </div>
          ) : (
            /* Premium Detail Fallback UI */
            <div
              className={`relative w-full h-[300px] sm:h-[400px] lg:h-[500px] ${seasonalGradient} rounded-xl overflow-hidden shadow-2xl flex items-center justify-center`}
            >
              {/* Animated Background Blobs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
              </div>

              {/* Glassmorphism Mockup */}
              <div className="relative z-10 w-full max-w-2xl aspect-video mx-auto px-6">
                <div className="w-full h-full bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-8 border-b-0">
                  {/* Browser-like Header */}
                  <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/10 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                    <div className="w-3 h-3 rounded-full bg-green-500/40" />
                  </div>

                  {/* Icon and Main Content */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-linear-to-br from-white/10 to-transparent flex items-center justify-center shadow-xl border border-white/10">
                      {project.technologies[0]?.icon ? (
                        <Icon
                          src={project.technologies[0].icon}
                          alt={t("techAlt")}
                          size={64}
                          className="drop-shadow-2xl"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-primary/20 animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-3 w-full max-w-sm">
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary/40 rounded-full" />
                      </div>
                      <div className="h-2 w-1/2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-primary/20 rounded-full" />
                      </div>
                    </div>
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
            <Badge variant="outline">
              +{tCommon("more", { count: remainingCount })}
            </Badge>
          )}
          <div className="ml-auto">
            <ViewCounter itemId={project.id} itemType="project" />
          </div>
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
              {t("category")}
            </p>
            <p className="text-base font-medium">{project.category}</p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {t("status")}
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
                  {tCommon("githubStats")}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className="flex items-center gap-1"
                    title={tCommon("stars")}
                  >
                    <span className="text-yellow-500">★</span>
                    {githubStats.stars}
                  </span>
                  <span
                    className="flex items-center gap-1"
                    title={tCommon("forks")}
                  >
                    <span className="text-blue-500">⑂</span>
                    {githubStats.forks}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {tCommon("created")}
                </p>
                <p className="text-sm font-medium">
                  {new Date(githubStats.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {tCommon("lastUpdated")}
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
              {t("liveDemo")}
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
              {t("sourceCode")}
            </a>
          )}
          <LikeButton itemId={project.id} itemType="project" />
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
                  {t("next")}
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
              {t("related")}
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
      {/* Comments Section */}
      <FadeIn delay={1.0}>
        <CommentSection itemId={project.id} itemType="project" />
      </FadeIn>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: project.title,
          description: project.shortDescription,
          applicationCategory: project.category,
          operatingSystem: "Web",
          author: {
            "@type": "Person",
            name: "Autumnnus",
            url: "https://autumnnus.com",
          },
          ...(project.coverImage ? { image: [project.coverImage] } : {}),
          ...(project.liveDemo ? { url: project.liveDemo } : {}),
        }}
      />

      {/* View All Projects Button */}
      <FadeIn delay={1.1}>
        <div className="text-center pt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            {t("viewAll")}
          </Link>
        </div>
      </FadeIn>
    </Container>
  );
}
