"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Project } from "@/types/contents";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ProjectsPage() {
  const { content } = useLanguage();
  const t = useTranslations("Projects");
  const projects = content.projects.items || [];

  const [selectedStatus, setSelectedStatus] = useState<
    Project["status"] | "All"
  >("All");
  const [selectedCategory, setSelectedCategory] = useState<string | "All">(
    "All",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredProjects = projects.filter((p) => {
    const statusMatch = selectedStatus === "All" || p.status === selectedStatus;
    const categoryMatch =
      selectedCategory === "All" || p.category === selectedCategory;

    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchLower) ||
      p.shortDescription.toLowerCase().includes(searchLower) ||
      p.technologies.some((tech) =>
        tech.name.toLowerCase().includes(searchLower),
      );

    return statusMatch && categoryMatch && searchMatch;
  });

  const visibleProjects = filteredProjects.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

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

      {/* Search and Filters */}
      <div className="space-y-8 mb-12">
        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-10 h-12 text-lg rounded-full border-primary/20 focus-visible:ring-primary"
          />
        </div>

        <div className="h-px bg-border/50" />

        <div className="flex flex-col gap-10">
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
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-primary/80">
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
          {visibleProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {visibleProjects.length < filteredProjects.length && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
            >
              {t("loadMore") || "Load More"}
            </button>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-4">
            <Search className="w-12 h-12 text-muted-foreground opacity-20" />
            <p className="text-xl font-medium text-muted-foreground">
              {t("noResults")}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
