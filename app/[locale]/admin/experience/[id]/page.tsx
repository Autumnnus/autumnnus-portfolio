import { auth } from "@/auth";
import ExperienceForm, { Experience } from "@/components/admin/ExperienceForm";
import Container from "@/components/common/Container";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const [experience, t] = await Promise.all([
    db.query.workExperience.findFirst({
      where: (e, { eq }) => eq(e.id, id),
      with: {
        translations: true,
      },
    }),
    getTranslations("Admin.Dashboard.experience"),
  ]);

  if (!experience) {
    notFound();
  }

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold mb-8">{t("edit")}</h1>
      <ExperienceForm initialData={experience as Experience} />
    </Container>
  );
}
