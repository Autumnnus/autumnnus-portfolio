import { getProjectFilters, getProjects } from "@/app/actions";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { Project } from "@/types/contents";
import { Language } from "@prisma/client";
import { getLocale } from "next-intl/server";

interface ProjectsPageProps {
  searchParams: Promise<{
    query?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const locale = await getLocale();
  const params = await searchParams;

  const query = params.query || "";
  const status = params.status || "All";
  const category = params.category || "All";
  const page = Number(params.page) || 1;

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
