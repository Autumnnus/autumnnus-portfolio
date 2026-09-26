"use client";

import type { PostCard, ProjectCard } from "@/lib/ai/agent/data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Briefcase, ExternalLink, Github, Linkedin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import NextLink from "next/link";
import { localizeHref, type ToolPart } from "./lib";
import PixelLeaf from "./PixelLeaf";

/**
 * Generative UI: tool results rendered with compact, on-brand cards so the
 * text answer can stay short. Cards link into the real site.
 */

function ProjectTile({ project, locale }: { project: ProjectCard; locale: string }) {
  return (
    <NextLink
      href={localizeHref(project.path, locale)}
      className={cn(
        "group flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--shadow-color)]",
        project.featured ? "border-amber-600/50 dark:border-amber-300/50" : "border-border",
      )}
    >
      <div className="relative h-24 w-full overflow-hidden bg-linear-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            unoptimized
            sizes="224px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/60">
            <PixelLeaf className="h-8 w-8" />
          </div>
        )}
        {project.year && (
          <span className="absolute right-1.5 top-1.5 rounded-sm bg-background/85 px-1.5 py-0.5 font-mono text-[0.6rem] text-muted-foreground backdrop-blur">
            {project.year}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <span className="line-clamp-1 text-sm font-semibold group-hover:text-primary">
          {project.title}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{project.summary}</span>
        <span className="mt-auto flex flex-wrap gap-1 pt-1">
          {project.technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[0.6rem] text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span className="px-1 font-mono text-[0.6rem] text-muted-foreground">
              +{project.technologies.length - 3}
            </span>
          )}
        </span>
      </div>
    </NextLink>
  );
}

function ProjectRail({ projects, total, locale }: { projects: ProjectCard[]; total: number; locale: string }) {
  const t = useTranslations("Assistant.cards");
  if (!projects.length) return null;
  return (
    <div className="my-2">
      <div
        data-lenis-prevent
        className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
      >
        {projects.map((project) => (
          <ProjectTile key={project.slug} project={project} locale={locale} />
        ))}
      </div>
      {total > projects.length && (
        <NextLink
          href={localizeHref("/projects", locale)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("viewAll", { count: total })} <ArrowUpRight className="h-3 w-3" />
        </NextLink>
      )}
    </div>
  );
}

function ProjectDetail({
  project,
  locale,
}: {
  project: ProjectCard;
  locale: string;
}) {
  const t = useTranslations("Assistant.cards");
  return (
    <div className="my-2 flex gap-3 rounded-lg border border-border bg-card p-2.5">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {project.coverImage ? (
          <Image src={project.coverImage} alt={project.title} fill unoptimized sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/60">
            <PixelLeaf className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <NextLink
          href={localizeHref(project.path, locale)}
          className="line-clamp-1 text-sm font-semibold hover:text-primary"
        >
          {project.title}
        </NextLink>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {[project.category, project.status, project.year].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <NextLink
            href={localizeHref(project.path, locale)}
            className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[0.65rem] font-medium hover:border-primary hover:text-primary"
          >
            {t("open")} <ArrowUpRight className="h-3 w-3" />
          </NextLink>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[0.65rem] font-medium hover:border-primary hover:text-primary"
            >
              <Github className="h-3 w-3" /> GitHub
            </a>
          )}
          {project.liveDemo && (
            <a
              href={project.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[0.65rem] font-medium hover:border-primary hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" /> {t("liveDemo")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PostList({ posts, locale }: { posts: PostCard[]; locale: string }) {
  if (!posts.length) return null;
  return (
    <ul className="my-2 divide-y divide-border/70 overflow-hidden rounded-lg border border-border bg-card">
      {posts.map((post) => (
        <li key={post.slug}>
          <NextLink
            href={localizeHref(post.path, locale)}
            className="group flex items-center gap-2 px-2.5 py-2 hover:bg-muted/60"
          >
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                {post.title}
              </span>
              <span className="block truncate font-mono text-[0.65rem] text-muted-foreground">
                {[post.publishedAt, post.readTime, ...post.tags.slice(0, 2).map((tag) => `#${tag}`)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

type CareerOutput = Extract<ToolPart, { type: "tool-getCareer"; state: "output-available" }>["output"];

function CareerTimeline({ career, locale }: { career: CareerOutput; locale: string }) {
  const t = useTranslations("Assistant.cards");
  const format = (month: string | null) =>
    month
      ? new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
          month: "short",
          year: "numeric",
        }).format(new Date(`${month}-01T00:00:00Z`))
      : "";
  if (!career.positions.length) return null;
  return (
    <div className="my-2 rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 font-pixel text-[0.6rem] uppercase text-primary">
        <Briefcase className="h-3 w-3" />
        {t("yearsExperience", { years: career.totalExperienceYears })}
      </div>
      <ol className="relative space-y-2 border-l border-border pl-3">
        {career.positions.slice(0, 5).map((position) => (
          <li key={position.cite} className="relative">
            <span
              className={cn(
                "absolute -left-[17px] top-1.5 h-2 w-2 rotate-45 border",
                position.current ? "border-primary bg-primary" : "border-border bg-background",
              )}
            />
            <p className="text-sm font-medium leading-tight">
              {position.role} <span className="text-muted-foreground">· {position.company}</span>
            </p>
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              {format(position.start)} – {position.current ? t("present") : format(position.end)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

type ProfileOutput = Extract<
  Extract<ToolPart, { type: "tool-getProfile"; state: "output-available" }>["output"],
  { found: true }
>["profile"];

function ProfileContact({ profile }: { profile: ProfileOutput }) {
  const links = [
    profile.links.email && { href: `mailto:${profile.links.email}`, label: "Email", Icon: Mail },
    profile.links.linkedin && { href: profile.links.linkedin, label: "LinkedIn", Icon: Linkedin },
    profile.links.github && { href: profile.links.github, label: "GitHub", Icon: Github },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Mail }[];
  if (!links.length) return null;
  return (
    <div className="my-2 flex flex-wrap gap-1.5">
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </a>
      ))}
    </div>
  );
}

/** Renders the card (if any) for one finished tool part. */
export default function ToolCard({
  part,
  locale,
  showContact,
}: {
  part: ToolPart;
  locale: string;
  showContact: boolean;
}) {
  if (part.state !== "output-available" || part.preliminary) return null;
  switch (part.type) {
    case "tool-listProjects":
      return <ProjectRail projects={part.output.projects} total={part.output.total} locale={locale} />;
    case "tool-getProject":
      return part.output.found ? <ProjectDetail project={part.output.project} locale={locale} /> : null;
    case "tool-listPosts":
      return <PostList posts={part.output.posts} locale={locale} />;
    case "tool-getCareer":
      return <CareerTimeline career={part.output} locale={locale} />;
    case "tool-getProfile":
      return showContact && part.output.found ? <ProfileContact profile={part.output.profile} /> : null;
    default:
      return null;
  }
}
