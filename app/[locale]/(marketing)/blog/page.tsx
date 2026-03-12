import { getBlogFilters, getBlogPosts } from "@/app/actions";
import BlogClient from "@/components/blog/BlogClient";
import { LanguageType as Language } from "@/lib/db/schema";
import { BlogPost } from "@/types/contents";
import { ensureBlogSort } from "@/types/sorting";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query?: string;
    tag?: string;
    page?: string;
    sort?: string;
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
  const sort = ensureBlogSort(searchParamsValue.sort);

  const [paginatedResult, filters] = await Promise.all([
    getBlogPosts({
      lang: locale as Language,
      search: query,
      tag,
      page,
      limit: 6,
      sort,
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
      searchParams={{ query, tag, page, sort }}
    />
  );
}
