import { auth } from "@/auth";
import ProfileForm from "@/components/admin/ProfileForm";
import SkillsManager from "@/components/admin/SkillsManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
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

  const [profile, skills, socialLinks] = await Promise.all([
    prisma.profile.findFirst({
      include: {
        translations: true,
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Container className="py-12 space-y-12">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Profil Bilgileri</h1>
        <ProfileForm initialData={profile || undefined} />
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold border-b pb-2">Ekstra Ayarlar</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <SocialLinksManager initialLinks={socialLinks} />
          <SkillsManager initialSkills={skills} />
        </div>
      </div>
    </Container>
  );
}
