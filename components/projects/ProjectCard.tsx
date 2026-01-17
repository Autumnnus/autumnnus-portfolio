"use client";

import { Project } from "@/config/projects";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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

  const visibleTechs = project.technologies.slice(0, 7);
  const remainingCount = project.technologies.length - 7;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Cover Image with Gradient */}
      <div className="relative w-full h-48 sm:h-56 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {/* Mockup Screen */}
          <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-lg shadow-2xl transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
            <div className="absolute top-2 left-2 flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">
              {project.technologies[0]?.icon || "💻"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-4">
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
            Technologies
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleTechs.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs"
              >
                {tech.icon && <span>{tech.icon}</span>}
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
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                project.status,
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {project.status === "Working"
                ? "All Systems Operational"
                : project.status}
            </span>
          </div>

          <Link
            href={`/projects/${project.slug}`}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View Details
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
