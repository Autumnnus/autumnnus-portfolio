import { deleteExperienceAction } from "@/app/[locale]/admin/actions";
import { auth } from "@/auth";
import Container from "@/components/common/Container";
import { prisma } from "@/lib/prisma";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminExperiencePage() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const experiences = await prisma.workExperience.findMany({
    include: {
      translations: {
        where: { language: "tr" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-12">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Deneyimler</h1>
            <p className="text-muted-foreground mt-1">
              İş deneyimlerini yönet.
            </p>
          </div>
        </div>
        <Link
          href="/admin/experience/new"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Yeni Ekle
        </Link>
      </div>

      <div className="grid gap-6">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="p-6 bg-card border border-border rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden border border-border">
                {exp.logo ? (
                  <Image
                    src={exp.logo}
                    alt={exp.company}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{exp.company}</h3>
                <p className="text-muted-foreground text-sm">
                  {exp.translations[0]?.role} •{" "}
                  {exp.startDate ? new Date(exp.startDate).getFullYear() : ""} -{" "}
                  {exp.endDate
                    ? new Date(exp.endDate).getFullYear()
                    : "Devam Ediyor"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/experience/${exp.id}`}
                className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                title="Düzenle"
              >
                <Pencil className="w-5 h-5" />
              </Link>
              <form
                action={async () => {
                  "use server";
                  await deleteExperienceAction(exp.id);
                }}
              >
                <button
                  type="submit"
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">Henüz deneyim eklenmedi.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
