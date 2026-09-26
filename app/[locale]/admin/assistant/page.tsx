import { auth } from "@/auth";
import AssistantSettingsForm from "@/components/admin/assistant/AssistantSettingsForm";
import IndexControls from "@/components/admin/assistant/IndexControls";
import RetrievalLab from "@/components/admin/assistant/RetrievalLab";
import VisitorAvatar from "@/components/admin/assistant/VisitorAvatar";
import Container from "@/components/common/Container";
import { Link } from "@/i18n/routing";
import { getAssistantSettings } from "@/lib/ai/chat/settings";
import { listVisitors, shortKey, type VisitorGrouping } from "@/lib/ai/chat/visitors";
import { getKnowledgeIndexStatus, type IndexReport } from "@/lib/ai/knowledge/indexer";
import { findModel } from "@/lib/ai/models";
import { getAiProviderStatus } from "@/lib/ai/providers";
import { db } from "@/lib/db";
import { assistantMessage, assistantThread, knowledgeChunk, knowledgeDocument } from "@/lib/db/schema";
import { cn, formatDateTime } from "@/lib/utils";
import { gte, sql } from "drizzle-orm";
import { AlertTriangle, Flag, Sparkles, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

const TABS = ["overview", "knowledge", "lab", "conversations"] as const;
type Tab = (typeof TABS)[number];

function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6", className)}>
      {title && <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs">{value}</span>
    </div>
  );
}

export default async function AdminAssistantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; by?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    redirect("/");
  }

  const { locale } = await params;
  const { tab: rawTab, by: rawBy } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "overview";
  const t = await getTranslations("Admin.Assistant");
  const providers = getAiProviderStatus();

  const tabs = (
    <nav className="mb-6 flex flex-wrap gap-2">
      {TABS.map((key) => (
        <Link
          key={key}
          href={`/admin/assistant?tab=${key}`}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            key === tab ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
          )}
        >
          {t(`tabs.${key}`)}
        </Link>
      ))}
    </nav>
  );

  let content: React.ReactNode = null;

  if (tab === "overview") {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [settings, [usage], [messages], [docs], [chunks]] = await Promise.all([
      getAssistantSettings(),
      db
        .select({
          threads: sql<number>`count(*)::int`,
          tokens: sql<number>`coalesce(sum(${assistantThread.inputTokens} + ${assistantThread.outputTokens}), 0)::int`,
          flagged: sql<number>`count(*) filter (where ${assistantThread.flagged})::int`,
        })
        .from(assistantThread)
        .where(gte(assistantThread.lastMessageAt, since)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assistantMessage)
        .where(gte(assistantMessage.createdAt, since)),
      db.select({ count: sql<number>`count(*)::int` }).from(knowledgeDocument),
      db.select({ count: sql<number>`count(*)::int` }).from(knowledgeChunk),
    ]);
    const report = settings.lastIndexReport as IndexReport | null;

    const evaluatorLabel =
      providers.evaluator === "jev"
        ? t("providers.evaluatorJev", { transport: providers.jevTransport ?? "" })
        : providers.evaluator === "gemini"
          ? t("providers.evaluatorGemini")
          : t("providers.evaluatorOff");

    content = (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("providers.title")}>
          {!providers.llmConfigured && (
            <p className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {t("providers.missingKey")}
            </p>
          )}
          <Row label={t("providers.fast")} value={findModel(settings.modelFast)?.label ?? settings.modelFast} />
          <Row label={t("providers.deep")} value={findModel(settings.modelDeep)?.label ?? settings.modelDeep} />
          <Row label={t("providers.embedding")} value={providers.embeddingModel} />
          <Row label={t("providers.evaluator")} value={evaluatorLabel} />
        </Card>

        <Card title={t("usage.title")}>
          <div className="grid grid-cols-2 gap-3">
            {[
              [t("usage.threads"), usage.threads],
              [t("usage.messages"), messages.count],
              [t("usage.tokens"), usage.tokens.toLocaleString(locale)],
              [t("usage.flagged"), usage.flagged],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("settings.title")}>
          <AssistantSettingsForm
            initial={{
              enabled: settings.enabled,
              modelFast: settings.modelFast,
              modelDeep: settings.modelDeep,
              visitorDailyLimit: settings.visitorDailyLimit,
              globalDailyLimit: settings.globalDailyLimit,
              retentionDays: settings.retentionDays,
              autoDelete: settings.autoDelete,
            }}
          />
        </Card>

        <Card title={t("index.title")}>
          <p className="mb-4 text-sm text-muted-foreground">{t("index.description")}</p>
          <Row label={t("index.documents")} value={docs.count} />
          <Row label={t("index.chunks")} value={chunks.count} />
          <Row
            label={t("index.lastRun")}
            value={
              report
                ? `${formatDateTime(report.startedAt, locale)} · ${report.indexed}/${report.scanned} · ${report.ms} ms${report.failed.length ? ` · ⚠ ${report.failed.length}` : ""}`
                : t("index.never")
            }
          />
          <div className="mt-4">
            <IndexControls disabled={!providers.llmConfigured} />
          </div>
        </Card>
      </div>
    );
  }

  if (tab === "knowledge") {
    const entries = await getKnowledgeIndexStatus();
    const badge: Record<string, string> = {
      fresh: "bg-green-500/10 text-green-700 dark:text-green-400",
      stale: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      missing: "bg-red-500/10 text-red-700 dark:text-red-400",
      orphan: "bg-muted text-muted-foreground",
    };
    content = (
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t("index.description")}</p>
          <IndexControls disabled={!providers.llmConfigured} />
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("index.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">{t("index.columns.title")}</th>
                  <th className="py-2 pr-3">{t("index.columns.type")}</th>
                  <th className="py-2 pr-3">{t("index.columns.language")}</th>
                  <th className="py-2 pr-3 text-right">{t("index.columns.chunks")}</th>
                  <th className="py-2 pr-3">{t("index.columns.indexedAt")}</th>
                  <th className="py-2">{t("index.columns.status")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.sourceType}:${entry.sourceId}:${entry.language}`} className="border-b border-border/40">
                    <td className="max-w-[18rem] truncate py-2 pr-3 font-medium">{entry.title}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{entry.sourceType}</td>
                    <td className="py-2 pr-3 font-mono text-xs uppercase">{entry.language}</td>
                    <td className="py-2 pr-3 text-right font-mono text-xs">{entry.chunkCount}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {entry.indexedAt ? formatDateTime(entry.indexedAt, locale) : "—"}
                    </td>
                    <td className="py-2">
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", badge[entry.status])}>
                        {t(`index.status.${entry.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  if (tab === "lab") {
    content = (
      <Card title={t("lab.title")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("lab.description")}</p>
        <RetrievalLab />
      </Card>
    );
  }

  if (tab === "conversations") {
    const by: VisitorGrouping = rawBy === "ip" ? "ip" : "visitor";
    const visitors = await listVisitors(by);
    content = (
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t("visitors.title")}</h2>
            <p className="text-sm text-muted-foreground">{t(`visitors.description.${by}`)}</p>
          </div>
          <div className="flex rounded-lg border border-border p-0.5 text-sm">
            {(["visitor", "ip"] as const).map((mode) => (
              <Link
                key={mode}
                href={`/admin/assistant?tab=conversations&by=${mode}`}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  mode === by ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {t(`visitors.by.${mode}`)}
              </Link>
            ))}
          </div>
        </div>
        {visitors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("threads.empty")}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {visitors.map((visitor) => (
              <li key={visitor.key}>
                <Link
                  href={`/admin/assistant/visitors/${encodeURIComponent(visitor.key)}?by=${by}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <VisitorAvatar seed={visitor.key} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {t(`visitors.label.${by}`, { id: shortKey(visitor.key) })}
                      {visitor.flagged && (
                        <Flag className="h-3.5 w-3.5 text-destructive" aria-label={t("threads.flagged")} />
                      )}
                      {visitor.deleted > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-destructive">
                          <Trash2 className="h-3 w-3" />
                          {t("threads.deletedCount", { count: visitor.deleted })}
                        </span>
                      )}
                      <span className="font-mono text-[0.65rem] font-normal uppercase text-muted-foreground">
                        {visitor.languages.join(" · ")}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">“{visitor.lastTitle || "—"}”</p>
                  </div>
                  <div className="hidden text-right font-mono text-[0.7rem] text-muted-foreground sm:block">
                    <p>
                      {t("visitors.stats", {
                        threads: visitor.threads,
                        messages: visitor.messages,
                      })}
                    </p>
                    <p>
                      {visitor.linked > 1
                        ? t(`visitors.linked.${by}`, { count: visitor.linked })
                        : `${visitor.tokens.toLocaleString(locale)} tok`}
                    </p>
                  </div>
                  <div className="w-32 shrink-0 text-right text-xs text-muted-foreground">
                    {formatDateTime(visitor.lastSeen, locale)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <Container className="py-6 sm:py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-lg bg-amber-500/10 p-3">
          <Sparkles className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
        </div>
      </div>
      {tabs}
      {content}
    </Container>
  );
}
