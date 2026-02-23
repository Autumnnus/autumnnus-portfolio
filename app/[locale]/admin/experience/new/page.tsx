import { auth } from "@/auth";
import ExperienceForm from "@/components/admin/ExperienceForm";
import Container from "@/components/common/Container";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function NewExperiencePage() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const t = await getTranslations("Admin.Dashboard.experience");

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold mb-8">{t("addNewTitle")}</h1>
      <ExperienceForm />
    </Container>
  );
}
