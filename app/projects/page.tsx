"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/Badge";
import { getAllStatuses, Project, projects } from "@/config/projects";
import { useState } from "react";

export default function ProjectsPage() {
  const statuses = getAllStatuses();
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
          Projects
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          My projects and work across different technologies and domains.
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Filter by Status */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Filter by Status</h2>
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
              ? "All Projects"
              : `${selectedStatus} Projects`}
          </h2>
          <span className="text-muted-foreground text-sm">
            ({filteredProjects.length} project
            {filteredProjects.length !== 1 ? "s" : ""})
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No projects found with this status.
          </div>
        )}
      </div>
    </Container>
  );
}
