"use client";

import Badge from "@/components/ui/badge";
import { Project } from "@/types/contents";
import { motion } from "framer-motion";
import Link from "next/link";

interface RelatedProjectCardProps {
  project: Project;
  index?: number;
}

export default function RelatedProjectCard({
  project,
  index = 0,
}: RelatedProjectCardProps) {
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

  const visibleTechs = project.technologies.slice(0, 3);
  const remainingCount = project.technologies.length - 3;

  return (
    <motion.div
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="block p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold leading-tight flex-1">
              {project.title}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
                project.status,
              )}`}
            >
              {project.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.shortDescription}
          </p>

          {/* Technologies */}
          <div className="flex flex-wrap gap-2">
            {visibleTechs.map((tech) => (
              <Badge
                key={tech.name}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {tech.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{remainingCount}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
