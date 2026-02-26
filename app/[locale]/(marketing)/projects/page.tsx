import { getProjectFilters, getProjects } from "@/app/actions";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { LanguageType as Language } from "@/lib/db/schema";
import { Project } from "@/types/contents";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ProjectsPage({
  params,
  searchParams,
}: ProjectsPageProps) {
  const { locale } = await params;
  const searchParamsValue = await searchParams;

  const query = searchParamsValue.query || "";
  const status = searchParamsValue.status || "All";
  const category = searchParamsValue.category || "All";
  const page = Number(searchParamsValue.page) || 1;

  const [paginatedResult, filters] = await Promise.all([
    getProjects({
      lang: locale as Language,
      search: query,
      status,
      category,
      page,
      limit: 6,
    }),
    getProjectFilters(),
  ]);

  return (
    <ProjectsClient
      initialData={
        paginatedResult as unknown as {
          items: Project[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }
      }
      filters={filters}
      searchParams={{ query, status, category, page }}
    />
  );
}
