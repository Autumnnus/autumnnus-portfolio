import { getBlogFilters, getBlogPosts } from "@/app/actions";
import BlogClient from "@/components/blog/BlogClient";
import { BlogPost } from "@/types/contents";
import { Language } from "@prisma/client";
import { getLocale } from "next-intl/server";

interface BlogPageProps {
  searchParams: Promise<{
    query?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const locale = await getLocale();
  const params = await searchParams;

  const query = params.query || "";
  const tag = params.tag || "All";
  const page = Number(params.page) || 1;

  const [paginatedResult, filters] = await Promise.all([
    getBlogPosts({
      lang: locale as Language,
      search: query,
      tag,
      page,
      limit: 6,
    }),
    getBlogFilters(),
  ]);

  return (
    <BlogClient
      initialData={
        paginatedResult as unknown as {
          items: BlogPost[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }
      }
      filters={filters}
      searchParams={{ query, tag, page }}
    />
  );
}
