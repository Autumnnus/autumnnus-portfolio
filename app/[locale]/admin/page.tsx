import { auth } from "@/auth";
import DatabaseManagement from "@/components/admin/DatabaseManagement";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { FileText, Folder, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboard() {
  const session = await auth();
  const t = await getTranslations("Admin.Dashboard");

  return (
    <Container className="py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("welcome")} {session?.user?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Projeler Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t("projects.title")}</h2>
          </div>
          <p className="text-muted-foreground">{t("projects.description")}</p>
          <div className="flex gap-4">
            <Link
              href="/admin/projects"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              {t("projects.manage")}
            </Link>
            <Link
              href="/admin/projects/new"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t("projects.new")}
            </Link>
          </div>
        </div>

        {/* Blog Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold">{t("blog.title")}</h2>
          </div>
          <p className="text-muted-foreground">{t("blog.description")}</p>
          <div className="flex gap-4">
            <Link
              href="/admin/blog"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              {t("blog.manage")}
            </Link>
            <Link
              href="/admin/blog/new"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t("blog.new")}
            </Link>
          </div>
        </div>

        {/* Profil Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold">{t("profile.title")}</h2>
          </div>
          <p className="text-muted-foreground">{t("profile.description")}</p>
          <div className="flex gap-4">
            <Link
              href="/admin/profile"
              className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
            >
              {t("profile.edit")}
            </Link>
          </div>
        </div>

        {/* Deneyim Yönetimi */}
        <div className="p-8 bg-card border border-border rounded-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">{t("experience.title")}</h2>
          </div>
          <p className="text-muted-foreground">{t("experience.description")}</p>
          <div className="flex gap-4">
            <Link
              href="/admin/experience"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
            >
              {t("experience.manage")}
            </Link>
            <Link
              href="/admin/experience/new"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {t("experience.new")}
            </Link>
          </div>
        </div>

        {/* Veritabanı Yönetimi */}
        <DatabaseManagement />
      </div>
    </Container>
  );
}
