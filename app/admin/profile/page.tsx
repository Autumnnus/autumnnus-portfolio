import { auth } from "@/auth";
import ProfileForm from "@/components/admin/ProfileForm";
import Container from "@/components/common/Container";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const profile = await prisma.profile.findFirst({
    include: {
      translations: true,
    },
  });

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold mb-8">Profil Bilgileri</h1>
      <ProfileForm initialData={profile || undefined} />
    </Container>
  );
}
