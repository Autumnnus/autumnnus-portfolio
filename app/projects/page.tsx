import { getProjects } from "@/app/actions";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { Project } from "@/types/contents";
import { Language } from "@prisma/client";
import { getLocale } from "next-intl/server";

export default async function ProjectsPage() {
  const locale = await getLocale();
  const dbProjects = await getProjects(locale as Language);

  // Cast Prisma result to frontend type if compatible, or map it.
  // The 'Project' type from '@/types/contents' expects status to be ProjectStatus enum
  // but Prisma returns string. We'll cast it for now as we know the strings match.
  const projects = dbProjects as unknown as Project[];

  return <ProjectsClient initialProjects={projects} />;
}
