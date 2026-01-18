import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { portfolioContent } from "@/config/contents";
import { Metadata } from "next";

const projects = portfolioContent.en.projects.items || [];

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

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
  const project = projects.find((p) => p.slug === slug);
  const { getRepoStats } = await import("@/lib/github");

  const githubStats = project ? await getRepoStats(project.github) : null;

  return <ProjectDetailView slug={slug} githubStats={githubStats} />;
}
