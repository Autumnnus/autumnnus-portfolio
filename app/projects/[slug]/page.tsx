import Container from "@/components/common/Container";
import RelatedProjectCard from "@/components/projects/RelatedProjectCard";
import { Badge } from "@/components/ui/Badge";
import {
  getProjectBySlug,
  getRelatedProjects,
  projects,
} from "@/config/projects";
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const project = getProjectBySlug(slug);

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
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = getRelatedProjects(slug, project.relatedProjects);

  // Find next project
  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const nextProject =
    currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  const getStatusColor = (status: typeof project.status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "Working":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Building":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "Archived":
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  const visibleTechs = project.technologies.slice(0, 4);
  const remainingCount = project.technologies.length - 4;

  return (
    <Container className="py-12 sm:py-20">
      {/* Back Button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Cover Image */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 rounded-lg overflow-hidden mb-8">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-lg shadow-2xl">
            <div className="absolute top-3 left-3 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-6xl sm:text-8xl opacity-50">
              {project.technologies[0]?.icon || "💻"}
            </div>
          </div>
        </div>
      </div>

      {/* Tags and Status */}
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

      {/* Title and Description */}
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
          {project.title}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          {project.fullDescription}
        </p>
      </div>

      {/* Project Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Timeline
          </p>
          <p className="text-base font-medium">{project.timeline}</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Role
          </p>
          <p className="text-base font-medium">{project.role}</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Team
          </p>
          <p className="text-base font-medium">{project.team}</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Status
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-12">
        {project.liveDemo && (
          <a
            href={project.liveDemo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
            Live Demo
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
            Source Code
          </a>
        )}
      </div>

      {/* Content Section */}
      {project.content && (
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            {project.title}: A{" "}
            {project.title.includes("Platform") ? "Platform" : "Project"}
          </h2>

          {/* Overview */}
          {project.content.overview && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-3">Overview</h3>
              <p className="text-muted-foreground leading-relaxed">
                {project.content.overview}
              </p>
            </div>
          )}

          {/* Features */}
          {project.content.features && project.content.features.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-3">Key Features</h3>
              <ul className="space-y-2">
                {project.content.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {project.content.challenges &&
            project.content.challenges.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3">Challenges</h3>
                <ul className="space-y-2">
                  {project.content.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Learnings */}
          {project.content.learnings &&
            project.content.learnings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3">What I Learned</h3>
                <ul className="space-y-2">
                  {project.content.learnings.map((learning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{learning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Next Project */}
      {nextProject && (
        <Link
          href={`/projects/${nextProject.slug}`}
          className="block mb-12 p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Next Project</p>
              <p className="text-lg font-bold group-hover:text-primary transition-colors">
                {nextProject.title}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      )}

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Related Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {relatedProjects.map((relatedProject) => (
              <RelatedProjectCard
                key={relatedProject.slug}
                project={relatedProject}
              />
            ))}
          </div>
        </div>
      )}

      {/* View All Projects Button */}
      <div className="text-center pt-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          View All Projects
        </Link>
      </div>
    </Container>
  );
}
