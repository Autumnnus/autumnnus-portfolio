import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { portfolioContent } from "@/config/contents";
import { Metadata } from "next";

// We use the English content for static generation and metadata as a default
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

  // We delegate the rendering to the Client Component which will use the context
  // to pick the correct language.
  return <ProjectDetailView slug={slug} />;
}
