import { getSkills } from "@/app/actions";
import ProjectForm from "@/components/admin/ProjectForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProjectPage() {
  const skills = await getSkills();

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> Dashboard'a Dön
        </Link>
        <h1 className="text-4xl font-bold mt-4">Yeni Proje Ekle</h1>
      </div>

      <ProjectForm skills={skills} />
    </Container>
  );
}
