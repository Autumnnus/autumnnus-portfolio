import { auth } from "@/auth";
import DeleteThreadButton from "@/components/admin/assistant/DeleteThreadButton";
import ThreadTranscript from "@/components/admin/assistant/ThreadTranscript";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { getOwnerIdentity } from "@/lib/ai/agent/data";
import type { AssistantUIMessage } from "@/lib/ai/agent/portfolio-agent";
import { toAssistantLocale } from "@/lib/ai/config";
import { db } from "@/lib/db";
import { assistantMessage, assistantThread } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Flag, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    redirect("/");
  }

  const { locale, id } = await params;
  const t = await getTranslations("Admin.Assistant.threads");

  const thread = await db.query.assistantThread.findFirst({ where: eq(assistantThread.id, id) });
  if (!thread) notFound();

  const rows = await db
    .select()
    .from(assistantMessage)
    .where(eq(assistantMessage.threadId, id))
    .orderBy(asc(assistantMessage.createdAt));
  const owner = await getOwnerIdentity(toAssistantLocale(thread.language));

  const messages = rows.map(
    (row) =>
      ({
        id: row.id,
        role: row.role as AssistantUIMessage["role"],
        parts: row.parts as AssistantUIMessage["parts"],
        metadata: (row.metadata ?? undefined) as AssistantUIMessage["metadata"],
      }) satisfies AssistantUIMessage,
  );

  return (
    <Container className="py-6 sm:py-12">
      <Link
        href="/admin/assistant?tab=conversations"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            {thread.flagged && <Flag className="h-5 w-5 text-destructive" aria-label={t("flagged")} />}
            {thread.title || "—"}
            {thread.deletedAt && (
              <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                {t("deletedByUser")} · {formatDateTime(thread.deletedAt, locale)}
              </span>
            )}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {formatDateTime(thread.createdAt, locale)} · {thread.language.toUpperCase()} ·{" "}
            {thread.messageCount} msgs · {(thread.inputTokens + thread.outputTokens).toLocaleString(locale)} tok
            {thread.entryPath ? ` · ${t("entryPath")}: ${thread.entryPath}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/assistant/visitors/${encodeURIComponent(thread.visitorId)}?by=visitor`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            {t("allChats")}
          </Link>
          <DeleteThreadButton id={thread.id} redirectTo="/admin/assistant?tab=conversations" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-background p-4 sm:p-6">
        <ThreadTranscript messages={messages} locale={locale} ownerName={owner.name.split(" ")[0]} />
      </div>
    </Container>
  );
}
