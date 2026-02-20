"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Project } from "@/types/contents";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ProjectsClientProps {
  initialData: {
    items: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    statuses: { status: string; count: number }[];
    categories: { category: string; count: number }[];
  };
  searchParams: {
    query: string;
    status: string;
    category: string;
    page: number;
  };
}

export default function ProjectsClient({
  initialData,
  filters,
  searchParams,
}: ProjectsClientProps) {
  const t = useTranslations("Projects");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.query);
  const [prevQuery, setPrevQuery] = useState(searchParams.query);

  if (searchParams.query !== prevQuery) {
    setPrevQuery(searchParams.query);
    setSearchQuery(searchParams.query);
  }

  const updateFilters = (updates: Partial<typeof searchParams>) => {
    const params = new URLSearchParams();
    const newParams = { ...searchParams, ...updates, page: updates.page || 1 };

    if (newParams.query) params.set("query", newParams.query);
    if (newParams.status && newParams.status !== "All")
      params.set("status", newParams.status);
    if (newParams.category && newParams.category !== "All")
      params.set("category", newParams.category);
    if (newParams.page > 1) params.set("page", newParams.page.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ query: searchQuery, page: 1 });
  };

  return (
    <Container className={`py-12 sm:py-20 ${isPending ? "opacity-70" : ""}`}>
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
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg rounded-full border-primary/20 focus-visible:ring-primary"
          />
        </form>

        <div className="h-px bg-border/50" />

        <div className="flex flex-col gap-10">
          {/* Filter by Status */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              {t("filterByStatus")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={searchParams.status === "All" ? "default" : "outline"}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                onClick={() => updateFilters({ status: "All" })}
              >
                {t("allProjects")}
              </Badge>
              {filters.statuses.map(({ status, count }) => (
                <Badge
                  key={status}
                  variant={
                    searchParams.status === status ? "default" : "outline"
                  }
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                  onClick={() => updateFilters({ status })}
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
                variant={
                  searchParams.category === "All" ? "default" : "outline"
                }
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                onClick={() => updateFilters({ category: "All" })}
              >
                {t("allCategories")}
              </Badge>
              {filters.categories.map(({ category, count }) => (
                <Badge
                  key={category}
                  variant={
                    searchParams.category === category ? "default" : "outline"
                  }
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                  onClick={() => updateFilters({ category })}
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
            {searchParams.status === "All" && searchParams.category === "All"
              ? t("allProjects")
              : `${searchParams.status !== "All" ? searchParams.status : ""} ${
                  searchParams.status !== "All" &&
                  searchParams.category !== "All"
                    ? "&"
                    : ""
                } ${
                  searchParams.category !== "All" ? searchParams.category : ""
                }`}
          </h2>
          <span className="text-muted-foreground text-sm">
            ({initialData.total} {t("projectCount")})
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialData.items.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              disabled={searchParams.page <= 1 || isPending}
              onClick={() => updateFilters({ page: searchParams.page - 1 })}
              className="px-6 py-2 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("previous") || "Previous"}
            </button>
            <span className="text-sm font-medium">
              {searchParams.page} / {initialData.totalPages}
            </span>
            <button
              disabled={
                searchParams.page >= initialData.totalPages || isPending
              }
              onClick={() => updateFilters({ page: searchParams.page + 1 })}
              className="px-6 py-2 bg-muted text-muted-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("next") || "Next"}
            </button>
          </div>
        )}

        {initialData.items.length === 0 && (
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
