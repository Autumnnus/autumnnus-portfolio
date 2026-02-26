import { getProjectById, getSkills } from "@/app/actions";
import ProjectForm from "@/components/admin/ProjectForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { id } = await params;
  const [project, skills, t] = await Promise.all([
    getProjectById(id),
    getSkills(),
    getTranslations("Admin.Dashboard.projects"),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> {t("backToProjects")}
        </Link>
        <h1 className="text-4xl font-bold mt-4">{t("editTitle")}</h1>
      </div>

      <ProjectForm skills={skills} initialData={project} />
    </Container>
  );
}
