"use client";

import { runIndexSyncAction } from "@/app/[locale]/admin/assistant/actions";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export default function IndexControls({ disabled }: { disabled: boolean }) {
  const t = useTranslations("Admin.Assistant.index");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (force: boolean) => {
    if (force && !confirm(t("rebuildConfirm"))) return;
    startTransition(async () => {
      try {
        const report = await runIndexSyncAction(force);
        const summary = t("done", {
          indexed: report.indexed,
          unchanged: report.unchanged,
          removed: report.removed,
        });
        if (report.failed.length) {
          toast.warning(`${summary} · ${t("failedCount", { count: report.failed.length })}`, {
            description: report.failed[0]?.error,
          });
        } else {
          toast.success(summary);
        }
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => run(false)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {pending ? t("running") : t("sync")}
      </button>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => run(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {t("rebuild")}
      </button>
    </div>
  );
}
