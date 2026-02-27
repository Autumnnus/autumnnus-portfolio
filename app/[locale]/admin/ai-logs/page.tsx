import AiLogsClient, {
  Session,
} from "@/app/[locale]/admin/ai-logs/AiLogsClient";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: `${t("Admin.Navigation.aiLogs") || "AI Logs"} | Admin` };
}

export default async function AdminAiLogsPage({
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

  const t = await getTranslations({ locale });

  const aiSessions = await db.query.aiChatSession.findMany({
    orderBy: (s, { desc }) => [desc(s.updatedAt)],
    with: {
      messages: {
        orderBy: (m, { asc }) => [asc(m.createdAt)],
      },
    },
  });

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {t("Admin.Dashboard.aiLogs.title") || "AI Logs"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("Admin.Dashboard.aiLogs.description") ||
            "Manage and view AI chat conversations."}
        </p>
      </div>

      <AiLogsClient sessions={aiSessions as Session[]} />
    </div>
  );
}
