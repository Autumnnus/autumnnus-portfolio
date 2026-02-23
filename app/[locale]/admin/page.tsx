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
    <Container className="py-8 sm:py-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 sm:mb-20 px-4 sm:px-0">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground font-medium opacity-80">
            {t("welcome")}{" "}
            <span className="text-primary">{session?.user?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 px-4 sm:px-0">
        {/* Projeler Yönetimi */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-primary/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <Folder size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner group-hover:bg-primary/20 transition-colors">
              <Folder className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("projects.title")}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("projects.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto relative z-10">
            <Link
              href="/admin/projects"
              className="flex-1 text-center px-6 py-3 bg-background border border-border/50 rounded-xl font-bold hover:bg-muted transition-all text-sm shadow-sm active:scale-[0.98]"
            >
              {t("projects.manage")}
            </Link>
            <Link
              href="/admin/projects/new"
              className="flex-1 text-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> {t("projects.new")}
            </Link>
          </div>
        </div>

        {/* Blog Yönetimi */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-orange-500/50 transition-all duration-500 shadow-xl hover:shadow-orange-500/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <FileText size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-orange-500/10 rounded-2xl shadow-inner group-hover:bg-orange-500/20 transition-colors">
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("blog.title")}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("blog.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto relative z-10">
            <Link
              href="/admin/blog"
              className="flex-1 text-center px-6 py-3 bg-background border border-border/50 rounded-xl font-bold hover:bg-muted transition-all text-sm shadow-sm active:scale-[0.98]"
            >
              {t("blog.manage")}
            </Link>
            <Link
              href="/admin/blog/new"
              className="flex-1 text-center px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> {t("blog.new")}
            </Link>
          </div>
        </div>

        {/* Profil Yönetimi */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-purple-500/50 transition-all duration-500 shadow-xl hover:shadow-purple-500/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <Plus size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-purple-500/10 rounded-2xl shadow-inner group-hover:bg-purple-500/20 transition-colors">
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("profile.title")}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("profile.description")}
          </p>
          <div className="flex gap-4 mt-auto relative z-10">
            <Link
              href="/admin/profile"
              className="w-full text-center px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98]"
            >
              {t("profile.edit")}
            </Link>
          </div>
        </div>

        {/* Deneyim Yönetimi */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-blue-500/50 transition-all duration-500 shadow-xl hover:shadow-blue-500/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <Plus size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl shadow-inner group-hover:bg-blue-500/20 transition-colors">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("experience.title")}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("experience.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto relative z-10">
            <Link
              href="/admin/experience"
              className="flex-1 text-center px-6 py-3 bg-background border border-border/50 rounded-xl font-bold hover:bg-muted transition-all text-sm shadow-sm active:scale-[0.98]"
            >
              {t("experience.manage")}
            </Link>
            <Link
              href="/admin/experience/new"
              className="flex-1 text-center px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> {t("experience.new")}
            </Link>
          </div>
        </div>

        {/* Live Chat Yönetimi */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-green-500/50 transition-all duration-500 shadow-xl hover:shadow-green-500/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <Plus size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-green-500/10 rounded-2xl shadow-inner group-hover:bg-green-500/20 transition-colors">
              <Plus className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("livechat.title")}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("livechat.description")}
          </p>
          <div className="flex gap-4 mt-auto relative z-10">
            <Link
              href="/admin/livechat"
              className="w-full text-center px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all text-sm shadow-lg shadow-green-500/20 active:scale-[0.98]"
            >
              {t("livechat.manage")}
            </Link>
          </div>
        </div>

        {/* AI Logs */}
        <div className="p-6 sm:p-8 bg-card border border-border/50 rounded-3xl space-y-6 sm:space-y-8 flex flex-col group hover:border-indigo-500/50 transition-all duration-500 shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rotate-12">
            <Plus size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-500/10 rounded-2xl shadow-inner group-hover:bg-indigo-500/20 transition-colors">
              <Plus className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("aiLogs.title") || "AI Logs"}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm sm:text-base leading-relaxed relative z-10 flex-1">
            {t("aiLogs.description") ||
              "Manage and view AI chat conversations."}
          </p>
          <div className="flex gap-4 mt-auto relative z-10">
            <Link
              href="/admin/ai-logs"
              className="w-full text-center px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              {t("livechat.manage")}
            </Link>
          </div>
        </div>

        {/* Veritabanı Yönetimi */}
        <div className="lg:col-span-3">
          <DatabaseManagement />
        </div>
      </div>
    </Container>
  );
}
