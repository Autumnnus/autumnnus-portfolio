import { getBlogFilters, getBlogPosts } from "@/app/actions";
import BlogClient from "@/components/blog/BlogClient";
import { BlogPost } from "@/types/contents";
import { Language } from "@prisma/client";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query?: string;
    tag?: string;
    page?: string;
  }>;
}

export default async function BlogPage({
  params,
  searchParams,
}: BlogPageProps) {
  const { locale } = await params;
  const searchParamsValue = await searchParams;

  const query = searchParamsValue.query || "";
  const tag = searchParamsValue.tag || "All";
  const page = Number(searchParamsValue.page) || 1;

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
