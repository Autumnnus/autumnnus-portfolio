import { auth } from "@/auth";
import ProfileForm from "@/components/admin/ProfileForm";
import SkillsManager from "@/components/admin/SkillsManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import Container from "@/components/common/Container";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect("/");
  }

  const t = await getTranslations("Admin.Dashboard.profile");
  const [profileData, skills, socialLinks] = await Promise.all([
    db.query.profile.findFirst({
      with: {
        translations: true,
        quests: {
          with: {
            translations: true,
          },
          orderBy: (q, { asc }) => [asc(q.order)],
        },
      },
    }),
    db.query.skill.findMany({ orderBy: (s, { asc }) => [asc(s.name)] }),
    db.query.socialLink.findMany({ orderBy: (s, { asc }) => [asc(s.name)] }),
  ]);

  return (
    <Container className="py-12 space-y-12">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">{t("infoTitle")}</h1>
        <ProfileForm initialData={profileData || undefined} />
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold border-b pb-2">
          {t("extraSettings")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <SocialLinksManager initialLinks={socialLinks} />
          <SkillsManager initialSkills={skills} />
        </div>
      </div>
    </Container>
  );
}
