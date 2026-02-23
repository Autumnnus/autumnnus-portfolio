import { getProjects } from "@/app/actions";
import AdminProjectList from "@/components/admin/AdminProjectList";
import AdminSearch from "@/components/admin/AdminSearch";
import Container from "@/components/common/Container";
import { Language } from "@prisma/client";
import { ArrowLeft, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const t = await getTranslations("Admin.Dashboard.projects");
  const tNav = await getTranslations("Admin.Navigation");
  const result = await getProjects({
    lang: Language.tr,
    limit: 100,
    search: query,
  });

  return (
    <Container className="py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={16} /> {tNav("dashboard")}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold mt-2 sm:mt-4">
            {t("pageTitle")}
          </h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus size={20} /> {t("newProject")}
        </Link>
      </div>

      <AdminSearch
        placeholder={t("searchPlaceholder") || "Projelerde ara..."}
      />
      <AdminProjectList projects={result.items} />
    </Container>
  );
}
