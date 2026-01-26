import { auth } from "@/auth";
import ExperienceForm, { Experience } from "@/components/admin/ExperienceForm";
import Container from "@/components/common/Container";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const experience = await prisma.workExperience.findUnique({
    where: { id },
    include: {
      translations: true,
    },
  });

  if (!experience) {
    notFound();
  }

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold mb-8">Deneyimi Düzenle</h1>
      <ExperienceForm initialData={experience as Experience} />
    </Container>
  );
}
