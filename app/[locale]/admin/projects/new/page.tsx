import { getSkills } from "@/app/actions";
import ProjectForm from "@/components/admin/ProjectForm";
import Container from "@/components/common/Container";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NewProjectPage() {
  const [skills, t] = await Promise.all([
    getSkills(),
    getTranslations("Admin.Dashboard.projects"),
  ]);

  return (
    <Container className="py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={20} /> {t("backToDashboard")}
        </Link>
        <h1 className="text-4xl font-bold mt-4">{t("addNewTitle")}</h1>
      </div>

      <ProjectForm skills={skills} />
    </Container>
  );
}
