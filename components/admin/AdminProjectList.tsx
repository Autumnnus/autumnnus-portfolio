"use client";

import { deleteProjectAction } from "@/app/[locale]/admin/actions";
import { Link, useRouter } from "@/i18n/routing";
import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

interface ProjectListProps {
  projects: {
    id: string;
    title: string;
    slug: string;
    status: string;
    category?: { id: string; name: string } | null;
  }[];
}

export default function AdminProjectList({ projects }: ProjectListProps) {
  const t = useTranslations("Admin.Common");
  const tForm = useTranslations("Admin.Form");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    startTransition(async () => {
      try {
        await deleteProjectAction(id);
        router.refresh();
      } catch {
        toast.error(t("deleteError"));
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return "✅";
      case "Working":
        return "🛠️";
      case "Building":
        return "🏗️";
      case "Archived":
        return "📦";
      default:
        return null;
    }
  };

  return (
    <div className="bg-card/95 border border-border/60 rounded-3xl overflow-hidden shadow-xl shadow-black/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[44%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="bg-muted/40 border-b border-border/60">
              <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-[0.18em] text-muted-foreground/90 whitespace-nowrap">
                {t("project")}
              </th>
              <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-[0.18em] text-muted-foreground/90 whitespace-nowrap">
                {t("status")}
              </th>
              <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-[0.18em] text-muted-foreground/90 whitespace-nowrap">
                {t("category")}
              </th>
              <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-[0.18em] text-muted-foreground/90 text-right whitespace-nowrap">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="group hover:bg-primary/[0.06] transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="block max-w-full font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors"
                    title={project.title}
                  >
                    {project.title}
                  </Link>
                  <div className="mt-1 inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/45 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                    <span className="truncate">/{project.slug}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex max-w-full items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    {getStatusIcon(project.status)}
                    {tForm(project.status) || project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex max-w-full items-center rounded-full border border-border/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/90"
                    title={project.category?.name || "-"}
                  >
                    <span className="truncate">{project.category?.name || "-"}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1.5 sm:gap-3">
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className="p-2.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all duration-300 shadow-sm hover:shadow-primary/10 border border-border/40 hover:border-primary/20"
                      title={t("edit")}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={isPending}
                      className="p-2.5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-all duration-300 shadow-sm hover:shadow-red-500/10 border border-border/40 hover:border-red-500/20"
                      title={t("delete")}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-12 text-center text-muted-foreground font-medium italic opacity-60"
                >
                  {t("noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
