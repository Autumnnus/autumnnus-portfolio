"use client";

import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/common/Container";
import Badge from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BlogPost } from "@/types/contents";
import { BlogSort, DEFAULT_BLOG_SORT } from "@/types/sorting";
import { Filter, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

interface BlogClientProps {
  initialData: {
    items: BlogPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    tags: { name: string; count: number }[];
  };
  searchParams: {
    query: string;
    tag: string;
    page: number;
    sort: BlogSort;
  };
}

export default function BlogClient({
  initialData,
  filters,
  searchParams,
}: BlogClientProps) {
  const t = useTranslations("Blog");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.query || "");
  const [pushedQuery, setPushedQuery] = useState(searchParams.query || "");
  const [sortValue, setSortValue] = useState<BlogSort>(
    searchParams.sort || DEFAULT_BLOG_SORT,
  );
  const [pushedSort, setPushedSort] = useState<BlogSort>(
    searchParams.sort || DEFAULT_BLOG_SORT,
  );

  const updateFilters = useCallback(
    (updates: Partial<typeof searchParams>) => {
      const params = new URLSearchParams();
      const newParams = {
        ...searchParams,
        ...updates,
        page: updates.page || 1,
      };
      const normalizedSort = newParams.sort || DEFAULT_BLOG_SORT;
      newParams.sort = normalizedSort;

      if (newParams.query) params.set("query", newParams.query);
      if (newParams.tag && newParams.tag !== "All")
        params.set("tag", newParams.tag);
      if (newParams.page > 1) params.set("page", newParams.page.toString());
      params.set("sort", normalizedSort);

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
  const currentUrlSort = searchParams.sort || DEFAULT_BLOG_SORT;
  if (!isPending && currentUrlSort !== pushedSort) {
    setSortValue(currentUrlSort);
    setPushedSort(currentUrlSort);
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

  const sortOptions: { value: BlogSort; label: string }[] = [
    { value: "recent", label: t("sortOptions.recent") },
    { value: "oldest", label: t("sortOptions.oldest") },
    { value: "featured", label: t("sortOptions.featured") },
  ];

  const handleSortChange = (value: BlogSort) => {
    if (value === sortValue) return;
    setSortValue(value);
    setPushedSort(value);
    updateFilters({ sort: value, page: 1 });
  };

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
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
          {/* Search Input */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative w-full"
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
              className="pl-12 h-14 text-base sm:text-lg rounded-[100px] border border-primary/30 bg-background/70 backdrop-blur-2xl focus-visible:ring-2 focus-visible:ring-primary/50 shadow-lg transition-all hover:shadow-2xl"
            />
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-auto">
              <Select
                value={sortValue}
                onValueChange={(value) =>
                  handleSortChange(value as BlogSort)
                }
              >
                <SelectTrigger className="h-14 min-w-[170px] rounded-full border border-primary/40 bg-gradient-to-br from-slate-900/60 to-slate-800/80 px-6 flex items-center justify-between text-left text-sm font-semibold text-foreground shadow-lg transition-all hover:border-primary hover:shadow-2xl">
                  <SelectValue placeholder={t("sortLabel")} />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="w-[min(220px,calc(100vw-2rem))]"
                >
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-14 px-6 rounded-full border border-primary/30 bg-background/70 backdrop-blur-2xl shadow-lg transition-all hover:border-primary hover:shadow-2xl flex items-center gap-2 font-medium shrink-0 justify-center">
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="text-foreground">{t("filters")}</span>
                  {searchParams.tag !== "All" && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs ml-1.5 font-bold">
                      1
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
                  {/* Popular Tags */}
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      {t("popularTags")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          searchParams.tag === "All" ? "default" : "outline"
                        }
                        className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                          searchParams.tag === "All"
                            ? "shadow-sm"
                            : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                        }`}
                        onClick={() => updateFilters({ tag: "All" })}
                      >
                        {t("allTags")}
                      </Badge>
                      {filters.tags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant={
                            searchParams.tag === tag.name ? "default" : "outline"
                          }
                          className={`px-3 py-1.5 text-sm cursor-pointer transition-all ${
                            searchParams.tag === tag.name
                              ? "shadow-sm"
                              : "hover:bg-primary/10 hover:border-primary/50 text-muted-foreground"
                          }`}
                          onClick={() => updateFilters({ tag: tag.name })}
                        >
                          {tag.name}{" "}
                          <span className="opacity-70 ml-1">({tag.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <div
        className={`transition-all duration-500 ease-in-out ${isPending ? "opacity-50 blur-[2px] pointer-events-none translate-y-2" : "opacity-100 blur-0 translate-y-0"}`}
      >
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("viewAll")}</h2>
          <span className="text-muted-foreground text-sm">
            ({initialData.total} {t("postCount")})
          </span>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialData.items.map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} />
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
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card py-20 text-center shadow-sm">
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
