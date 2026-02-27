import {
  getProjectBySlug,
  getProjects,
  getSimilarProjects,
} from "@/app/actions";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { LanguageType as Language } from "@/lib/db/schema";
import { Project } from "@/types/contents";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const result = await getProjects({ lang: "en", limit: 100 });
  return result.items.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug, locale as Language);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autumnnus.com";
  const url = `${baseUrl}/${locale}/projects/${slug}`;
  const ogImage = project.coverImage
    ? [{ url: project.coverImage, alt: project.title }]
    : [];

  return {
    title: {
      default: project.metaTitle || project.title,
      template: `%s | Autumnnus Projects`,
    },
    description: project.metaDescription || project.shortDescription,
    keywords: project.keywords || [],
    openGraph: {
      type: "website",
      locale: locale,
      url: url,
      title: project.metaTitle || project.title,
      description: project.metaDescription || project.shortDescription,
      siteName: "Autumnnus",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: project.metaTitle || project.title,
      description: project.metaDescription || project.shortDescription,
      images: ogImage,
    },
    alternates: {
      canonical: url,
      languages: {
        [locale]: url,
      },
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug, locale as Language);

  if (!project) {
    notFound();
  }

  const { getRepoStats } = await import("@/lib/github");
  const githubStats = await getRepoStats(project.github || undefined);

  const similarProjects = await getSimilarProjects(
    project.id,
    locale as Language,
    2,
  );

  return (
    <ProjectDetailView
      project={project as unknown as Project}
      githubStats={githubStats}
      relatedProjects={similarProjects as unknown as Project[]}
    />
  );
}
