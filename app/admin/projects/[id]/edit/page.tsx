import { getProjectById, getSkills } from "@/app/actions";
import ProjectForm from "@/components/admin/ProjectForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { id } = await params;
  const [project, skills] = await Promise.all([
    getProjectById(id),
    getSkills(),
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
          <ArrowLeft size={20} /> Projelere Dön
        </Link>
        <h1 className="text-4xl font-bold mt-4">Projeyi Düzenle</h1>
      </div>

      <ProjectForm skills={skills} initialData={project} />
    </Container>
  );
}
