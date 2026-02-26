import { deleteExperienceAction } from "@/app/[locale]/admin/actions";
import { auth } from "@/auth";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { db } from "@/lib/db";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function AdminExperiencePage() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const t = await getTranslations("Admin.Dashboard.experience");
  const tCommon = await getTranslations("Admin.Common");
  const experiences = await db.query.workExperience.findMany({
    with: {
      translations: {
        where: (t, { eq }) => eq(t.language, "tr"),
      },
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  return (
    <Container className="py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
        <div className="flex items-center gap-4">
          <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold">{t("title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <Link
          href="/admin/experience/new"
          className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" /> {t("new")}
        </Link>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {experiences.map((exp: any) => (
          <div
            key={exp.id}
            className="p-4 sm:p-6 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg overflow-hidden border border-border shrink-0">
                {exp.logo ? (
                  <Image
                    src={exp.logo}
                    alt={exp.company}
                    fill
                    className="object-contain p-1.5 sm:p-2"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold truncate">
                  {exp.company}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {exp.translations[0]?.role} •{" "}
                  {exp.startDate ? new Date(exp.startDate).getFullYear() : ""} -{" "}
                  {exp.endDate
                    ? new Date(exp.endDate).getFullYear()
                    : t("ongoing")}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Link
                href={`/admin/experience/${exp.id}`}
                className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                title={tCommon("edit")}
              >
                <Pencil className="w-5 h-5" />
              </Link>
              <form
                className="flex-1 sm:flex-none"
                action={async () => {
                  "use server";
                  await deleteExperienceAction(exp.id);
                }}
              >
                <button
                  type="submit"
                  className="w-full p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                  title={tCommon("delete")}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">{t("noResults")}</p>
          </div>
        )}
      </div>
    </Container>
  );
}
