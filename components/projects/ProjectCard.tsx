"use client";

import Icon from "@/components/common/Icon";
import { Project } from "@/types/contents";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
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
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      {/* Cover Image with Gradient */}
      <div className="relative w-full h-48 sm:h-56 bg-linear-to-br from-pink-400 via-purple-500 to-indigo-600 overflow-hidden">
        {project.coverImage && (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          {/* Mockup Screen or Icon overlay */}
          {!project.coverImage && (
            <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-lg shadow-2xl transform -rotate-2 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center">
              <div className="text-4xl opacity-50">
                {project.technologies[0]?.icon && (
                  <Icon
                    src={project.technologies[0].icon}
                    alt="Tech"
                    size={48}
                  />
                )}
              </div>
            </div>
          )}
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
            Details
            <span>→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
