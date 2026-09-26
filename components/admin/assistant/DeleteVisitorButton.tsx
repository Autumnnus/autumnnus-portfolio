"use client";

import { deleteAssistantVisitorAction } from "@/app/[locale]/admin/assistant/actions";
import { useRouter } from "@/i18n/routing";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export default function DeleteVisitorButton({ by, visitorKey }: { by: "visitor" | "ip"; visitorKey: string }) {
  const t = useTranslations("Admin.Assistant.visitors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("deleteAllConfirm"))) return;
        startTransition(async () => {
          await deleteAssistantVisitorAction(by, visitorKey);
          router.push(`/admin/assistant?tab=conversations&by=${by}`);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {t("deleteAll")}
    </button>
  );
}
