"use client";

import BlogCard from "@/components/blog/BlogCard";
import Container from "@/components/common/Container";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { BlogPost } from "@/types/contents";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
    if (newParams.tag && newParams.tag !== "All")
      params.set("tag", newParams.tag);
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
            placeholder={t("searchPlaceholder") || "Search posts..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg rounded-full border-primary/20 focus-visible:ring-primary"
          />
        </form>

        <div className="h-px bg-border/50" />

        {/* Popular Tags */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            {t("popularTags")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={searchParams.tag === "All" ? "default" : "outline"}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
              onClick={() => updateFilters({ tag: "All" })}
            >
              {t("allTags") || "All Tags"}
            </Badge>
            {filters.tags.map((tag) => (
              <Badge
                key={tag.name}
                variant={searchParams.tag === tag.name ? "default" : "outline"}
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                onClick={() => updateFilters({ tag: tag.name })}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <div>
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
