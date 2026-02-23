"use client";

import { deleteProjectAction } from "@/app/[locale]/admin/actions";
import { Link } from "@/i18n/routing";
import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

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
        toast.error(t("deleteError"));
      }
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/50">
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t("project")}
              </th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t("status")}
              </th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t("category")}
              </th>
              <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-primary/5 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                    {project.title}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter opacity-60">
                    /{project.slug}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold uppercase tracking-tight text-muted-foreground/80 whitespace-nowrap">
                  {project.category}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1.5 sm:gap-3">
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className="p-2.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all duration-300 shadow-sm hover:shadow-primary/10 border border-transparent hover:border-primary/20"
                      title={t("edit")}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={isPending}
                      className="p-2.5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-all duration-300 shadow-sm hover:shadow-red-500/10 border border-transparent hover:border-red-500/20"
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
