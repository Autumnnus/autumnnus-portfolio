import { getProjectBySlug, getProjects } from "@/app/actions";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { Project } from "@/types/contents";
import { Language } from "@prisma/client";
import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const result = await getProjects({ lang: Language.en, limit: 100 });
  return result.items.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const project = await getProjectBySlug(slug, locale as Language);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} | Autumnnus Projects`,
    description: project.shortDescription,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const project = await getProjectBySlug(slug, locale as Language);

  if (!project) {
    notFound();
  }

  const { getRepoStats } = await import("@/lib/github");
  const githubStats = await getRepoStats(project.github || undefined);

  return (
    <ProjectDetailView
      project={project as unknown as Project}
      githubStats={githubStats}
    />
  );
}
