import { auth } from "@/auth";
import DeleteThreadButton from "@/components/admin/assistant/DeleteThreadButton";
import DeleteVisitorButton from "@/components/admin/assistant/DeleteVisitorButton";
import ThreadTranscript from "@/components/admin/assistant/ThreadTranscript";
import VisitorAvatar from "@/components/admin/assistant/VisitorAvatar";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { getOwnerIdentity } from "@/lib/ai/agent/data";
import { getVisitorThreads, shortKey, type VisitorGrouping } from "@/lib/ai/chat/visitors";
import { toAssistantLocale } from "@/lib/ai/config";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Flag, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export default async function AdminVisitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; key: string }>;
  searchParams: Promise<{ by?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    redirect("/");
  }

  const { locale, key: rawKey } = await params;
  const { by: rawBy } = await searchParams;
  const by: VisitorGrouping = rawBy === "ip" ? "ip" : "visitor";
  const key = decodeURIComponent(rawKey);
  const t = await getTranslations("Admin.Assistant");

  const threads = await getVisitorThreads(by, key);
  if (!threads.length) notFound();

  const owner = await getOwnerIdentity(toAssistantLocale(locale));
  const totalMessages = threads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const totalTokens = threads.reduce((sum, thread) => sum + thread.tokens, 0);
  const firstSeen = threads.at(-1)!.createdAt;
  const lastSeen = threads[0].lastMessageAt;
  const networks = new Set(threads.map((thread) => thread.ipKey).filter(Boolean)).size;
  const browsers = new Set(threads.map((thread) => thread.visitorId)).size;

  return (
    <Container className="py-6 sm:py-12">
      <Link
        href={`/admin/assistant?tab=conversations&by=${by}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("threads.back")}
      </Link>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <VisitorAvatar seed={key} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">
            {t(`visitors.label.${by}`, { id: shortKey(key) })}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {t("visitors.summary", {
              threads: threads.length,
              messages: totalMessages,
              tokens: totalTokens.toLocaleString(locale),
            })}
            {" · "}
            {formatDateTime(firstSeen, locale)} → {formatDateTime(lastSeen, locale)}
            {by === "visitor" && networks > 1 ? ` · ${t("visitors.linked.visitor", { count: networks })}` : ""}
            {by === "ip" && browsers > 1 ? ` · ${t("visitors.linked.ip", { count: browsers })}` : ""}
          </p>
        </div>
        <DeleteVisitorButton by={by} visitorKey={key} />
      </div>

      <div className="space-y-4">
        {threads.map((thread, index) => (
          <details
            key={thread.id}
            open={index === 0}
            className="group rounded-2xl border border-border/60 bg-card"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
              <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
                {thread.flagged && <Flag className="h-4 w-4 shrink-0 text-destructive" aria-label={t("threads.flagged")} />}
                <span className="truncate">{thread.title || "—"}</span>
                {thread.deletedAt && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-destructive"
                    title={formatDateTime(thread.deletedAt, locale)}
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("threads.deletedByUser")}
                  </span>
                )}
              </span>
              <span className="font-mono text-[0.7rem] text-muted-foreground">
                {formatDateTime(thread.lastMessageAt, locale)} · {thread.language.toUpperCase()} ·{" "}
                {thread.messages.length} msgs
                {thread.entryPath ? ` · ${thread.entryPath}` : ""}
              </span>
            </summary>
            <div className="border-t border-border/60 px-4 py-5 sm:px-6">
              <div className="mx-auto max-w-2xl">
                <ThreadTranscript
                  messages={thread.messages}
                  locale={locale}
                  ownerName={owner.name.split(" ")[0]}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Link
                  href={`/admin/assistant/threads/${thread.id}`}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {t("visitors.openThread")}
                </Link>
                <DeleteThreadButton id={thread.id} />
              </div>
            </div>
          </details>
        ))}
      </div>
    </Container>
  );
}
