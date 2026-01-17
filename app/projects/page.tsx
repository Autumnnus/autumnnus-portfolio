"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/types/contents";
import { useState } from "react";

export default function ProjectsPage() {
  const { content } = useLanguage();
  const projects = content.projects.items || [];

  // Calculate statuses dynamically from the current projects list
  const statusCounts = new Map<Project["status"], number>();
  projects.forEach((project) => {
    statusCounts.set(
      project.status,
      (statusCounts.get(project.status) || 0) + 1,
    );
  });
  const statuses = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  const [selectedStatus, setSelectedStatus] = useState<
    Project["status"] | "All"
  >("All");

  const filteredProjects =
    selectedStatus === "All"
      ? projects
      : projects.filter((p) => p.status === selectedStatus);

  return (
    <Container className="py-12 sm:py-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {content.projects.title}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {content.projects.description}
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Filter by Status */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          {content.projects.filterByStatusText}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedStatus === "All" ? "default" : "outline"}
            className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
            onClick={() => setSelectedStatus("All")}
          >
            All ({projects.length})
          </Badge>
          {statuses.map(({ status, count }) => (
            <Badge
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
              onClick={() => setSelectedStatus(status)}
            >
              {status} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {selectedStatus === "All"
              ? content.projects.allProjectsText
              : `${selectedStatus}`}
          </h2>
          <span className="text-muted-foreground text-sm">
            ({filteredProjects.length} {content.projects.projectCountText})
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {content.projects.noResultsText}
          </div>
        )}
      </div>
    </Container>
  );
}
