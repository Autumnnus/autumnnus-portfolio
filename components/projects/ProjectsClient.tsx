"use client";

import Container from "@/components/common/Container";
import ProjectCard from "@/components/projects/ProjectCard";
import Badge from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Project } from "@/types/contents";
import { Filter, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

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

  const [searchQuery, setSearchQuery] = useState(searchParams.query || "");
  const [pushedQuery, setPushedQuery] = useState(searchParams.query || "");

  const updateFilters = useCallback(
    (updates: Partial<typeof searchParams>) => {
      const params = new URLSearchParams();
      const newParams = {
        ...searchParams,
        ...updates,
        page: updates.page || 1,
      };

      if (newParams.query) params.set("query", newParams.query);
      if (newParams.status && newParams.status !== "All")
        params.set("status", newParams.status);
      if (newParams.category && newParams.category !== "All")
        params.set("category", newParams.category);
      if (newParams.page > 1) params.set("page", newParams.page.toString());

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  const currentUrlQuery = searchParams.query || "";
  if (!isPending && currentUrlQuery !== pushedQuery) {
    setSearchQuery(currentUrlQuery);
    setPushedQuery(currentUrlQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== pushedQuery) {
        if (searchQuery.length >= 2 || searchQuery.length === 0) {
          setPushedQuery(searchQuery);
          updateFilters({ query: searchQuery, page: 1 });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, pushedQuery, updateFilters]);

  return (
    <Container className="py-12 sm:py-20 transition-all duration-500 ease-in-out">
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
      <div className="space-y-6 mb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center max-w-3xl mx-auto">
          {/* Search Input */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative flex-1 w-full"
          >
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity duration-300 ${isPending ? "opacity-100" : "opacity-100"}`}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base sm:text-lg rounded-2xl border-primary/20 bg-background/50 backdrop-blur-xl focus-visible:ring-primary shadow-sm transition-all hover:shadow-md"
            />
          </form>

          {/* Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-14 px-6 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:bg-primary/5 flex items-center gap-2 font-medium shrink-0 w-full sm:w-auto justify-center">
                <Filter className="w-5 h-5 text-primary" />
                <span className="text-foreground">{t("filters")}</span>
                {(searchParams.status !== "All" ||
                  searchParams.category !== "All") && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs ml-1.5 font-bold">
                    {
                      [
                        searchParams.status !== "All",
                        searchParams.category !== "All",
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-[380px] p-6 rounded-2xl shadow-xl border-primary/20"
              align="end"
              sideOffset={8}
            >
              <div className="flex flex-col gap-8">
                {/* Filter by Status */}
                <div>
                  <h3 className="text-base font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {t("filterByStatus")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        searchParams.status === "All" ? "default" : "outline"
                      }
                      className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                        searchParams.status === "All"
                          ? "shadow-sm"
                          : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                      }`}
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
                        className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                          searchParams.status === status
                            ? "shadow-sm"
                            : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                        }`}
                        onClick={() => updateFilters({ status })}
                      >
                        {status}{" "}
                        <span className="opacity-70 ml-1">({count})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50 w-full" />

                {/* Filter by Category */}
                <div>
                  <h3 className="text-base font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {t("filterByCategory")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        searchParams.category === "All" ? "default" : "outline"
                      }
                      className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                        searchParams.category === "All"
                          ? "shadow-sm"
                          : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                      }`}
                      onClick={() => updateFilters({ category: "All" })}
                    >
                      {t("allCategories")}
                    </Badge>
                    {filters.categories.map(({ category, count }) => (
                      <Badge
                        key={category}
                        variant={
                          searchParams.category === category
                            ? "default"
                            : "outline"
                        }
                        className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                          searchParams.category === category
                            ? "shadow-sm"
                            : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                        }`}
                        onClick={() => updateFilters({ category })}
                      >
                        {category}{" "}
                        <span className="opacity-70 ml-1">({count})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Projects Section */}
      <div
        className={`transition-all duration-500 ease-in-out ${isPending ? "opacity-50 blur-[2px] pointer-events-none translate-y-2" : "opacity-100 blur-0 translate-y-0"}`}
      >
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
              {t("previous")}
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
              {t("next")}
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
