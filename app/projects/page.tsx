"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";
import { Project } from "@/types/contents";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ProjectsPage() {
  const { content } = useLanguage();
  const t = useTranslations("Projects");
  const projects = content.projects.items || [];

  // Calculate counts dynamically from the current projects list
  const statusCounts = new Map<Project["status"], number>();
  const categoryCounts = new Map<string, number>();

  projects.forEach((project) => {
    statusCounts.set(
      project.status,
      (statusCounts.get(project.status) || 0) + 1,
    );
    categoryCounts.set(
      project.category,
      (categoryCounts.get(project.category) || 0) + 1,
    );
  });

  const statuses = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  const categories = Array.from(categoryCounts.entries()).map(
    ([category, count]) => ({
      category,
      count,
    }),
  );

  const [selectedStatus, setSelectedStatus] = useState<
    Project["status"] | "All"
  >("All");
  const [selectedCategory, setSelectedCategory] = useState<string | "All">(
    "All",
  );

  const filteredProjects = projects.filter((p) => {
    const statusMatch = selectedStatus === "All" || p.status === selectedStatus;
    const categoryMatch =
      selectedCategory === "All" || p.category === selectedCategory;
    return statusMatch && categoryMatch;
  });

  return (
    <Container className="py-12 sm:py-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-12" />

      {/* Filters */}
      <div className="flex flex-col gap-10 mb-12">
        {/* Filter by Status */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            {t("filterByStatus")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedStatus === "All" ? "default" : "outline"}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
              onClick={() => setSelectedStatus("All")}
            >
              {t("allProjects")} ({projects.length})
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

        {/* Filter by Category */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            {t("filterByCategory")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "All" ? "default" : "outline"}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
              onClick={() => setSelectedCategory("All")}
            >
              {t("allCategories")} ({projects.length})
            </Badge>
            {categories.map(({ category, count }) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {selectedStatus === "All" && selectedCategory === "All"
              ? t("allProjects")
              : `${selectedStatus !== "All" ? selectedStatus : ""} ${
                  selectedStatus !== "All" && selectedCategory !== "All"
                    ? "&"
                    : ""
                } ${selectedCategory !== "All" ? selectedCategory : ""}`}
          </h2>
          <span className="text-muted-foreground text-sm">
            ({filteredProjects.length} {t("projectCount")})
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
            {t("noResults")}
          </div>
        )}
      </div>
    </Container>
  );
}
