"use client";

import { deleteAssistantThreadAction } from "@/app/[locale]/admin/assistant/actions";
import { useRouter } from "@/i18n/routing";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export default function DeleteThreadButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const t = useTranslations("Admin.Assistant.threads");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("deleteConfirm"))) return;
        startTransition(async () => {
          await deleteAssistantThreadAction(id);
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {t("delete")}
    </button>
  );
}
