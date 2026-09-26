"use client";

import { runRetrievalLabAction } from "@/app/[locale]/admin/assistant/actions";
import { cn } from "@/lib/utils";
import { FlaskConical, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type LabResult = Awaited<ReturnType<typeof runRetrievalLabAction>>;

function Meter({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full",
            value >= 0.6 ? "bg-green-500" : value >= 0.3 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="font-mono">{value.toFixed(2)}</span>
    </span>
  );
}

export default function RetrievalLab() {
  const t = useTranslations("Admin.Assistant.lab");
  const locale = useLocale() === "en" ? "en" : "tr";
  const [query, setQuery] = useState("");
  const [judge, setJudge] = useState(true);
  const [result, setResult] = useState<LabResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      try {
        setResult(await runRetrievalLabAction(query, judge, locale));
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim().length >= 2) run();
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={judge} onChange={(e) => setJudge(e.target.checked)} />
          {t("judge")}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {t("run")}
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
            <p>
              {t("stages", {
                lexical: result.trace.lexical,
                vector: result.trace.vector,
                pooled: result.trace.pooled,
                kept: result.trace.kept,
              })}
              {result.trace.judge ? ` · ${result.trace.judge.provider}` : ""}
            </p>
            <p>{t("timing", result.trace.ms)}</p>
            {result.trace.degraded.map((line) => (
              <p key={line} className="text-amber-600">
                ⚠ {line}
              </p>
            ))}
          </div>
          {result.hits.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <ol className="space-y-2">
              {result.hits.map((hit, index) => (
                <li key={hit.chunkId} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-primary">#{index + 1}</span>
                    <span className="font-semibold">{hit.title}</span>
                    {hit.heading && <span className="text-muted-foreground">› {hit.heading}</span>}
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.65rem] uppercase">
                      {hit.sourceType} · {hit.language}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{hit.snippet}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem]">
                    <span>
                      {t("lexicalRank")} <span className="font-mono">{hit.lexicalRank ?? "—"}</span>
                    </span>
                    <span>
                      {t("vectorRank")} <span className="font-mono">{hit.vectorRank ?? "—"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {t("similarity")} <Meter value={hit.similarity} />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {t("relevance")} <Meter value={hit.relevance} />
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
