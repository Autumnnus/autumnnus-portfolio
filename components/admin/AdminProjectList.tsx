"use client";

import { deleteProjectAction } from "@/app/[locale]/admin/actions";
import { Link } from "@/i18n/routing";
import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface ProjectListProps {
  projects: {
    id: string;
    title: string;
    slug: string;
    status: string;
    category: string;
  }[];
}

export default function AdminProjectList({ projects }: ProjectListProps) {
  const t = useTranslations("Admin.Common");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    startTransition(async () => {
      try {
        await deleteProjectAction(id);
        router.refresh();
      } catch {
        alert(t("deleteError"));
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-4 font-bold text-sm uppercase">{t("project")}</th>
            <th className="p-4 font-bold text-sm uppercase">{t("status")}</th>
            <th className="p-4 font-bold text-sm uppercase">{t("category")}</th>
            <th className="p-4 font-bold text-sm uppercase text-right">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((project) => (
            <tr
              key={project.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium">{project.title}</div>
                <div className="text-xs text-muted-foreground">
                  {project.slug}
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  {project.status}
                </span>
              </td>
              <td className="p-4 text-sm">{project.category}</td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={isPending}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                {t("noResults")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
