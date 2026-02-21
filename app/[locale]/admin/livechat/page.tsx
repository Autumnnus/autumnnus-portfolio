import { auth } from "@/auth";
import LiveChatSettings from "@/components/admin/LiveChatSettings";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.Dashboard" });
  return {
    title: `${t("livechat.title") || "Live Chat"} | Admin`,
  };
}

export default async function AdminLiveChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations({ locale, namespace: "Admin.Dashboard" });

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t("livechat.title") || "Live Chat Ayarları"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("livechat.description") ||
              "Live chat davranışını ve karşılama mesajlarını buradan yönetin."}
          </p>
        </div>
        <div className="pt-4">
          <LiveChatSettings />
        </div>
      </div>
    </div>
  );
}
