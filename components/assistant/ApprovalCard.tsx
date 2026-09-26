"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Mail, Send, ShieldCheck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ToolPart } from "./lib";

type ContactPart = Extract<ToolPart, { type: "tool-contactOwner" }>;

/**
 * Human-in-the-loop confirmation for the only side-effecting tool.
 * The request is HMAC-signed server-side; this card only sends yes/no.
 */
export default function ApprovalCard({
  part,
  ownerName,
  onRespond,
  disabled,
}: {
  part: ContactPart;
  ownerName: string;
  onRespond: (approvalId: string, approved: boolean) => void;
  disabled: boolean;
}) {
  const t = useTranslations("Assistant.approval");
  const input = part.input;
  if (!input) return null;

  const header = (
    <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
      <Mail className="h-3.5 w-3.5 text-primary" />
      <span className="font-pixel text-[0.6rem] uppercase tracking-wide text-primary">
        {t("title", { name: ownerName })}
      </span>
    </div>
  );

  const body = (
    <dl className="space-y-1.5 px-3 py-2 text-xs">
      {input.topic && (
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-foreground">{t("topic")}</dt>
          <dd className="font-medium">{t(`topics.${input.topic}`)}</dd>
        </div>
      )}
      {input.name && (
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-foreground">{t("name")}</dt>
          <dd className="font-medium">{input.name}</dd>
        </div>
      )}
      {input.replyTo && (
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-foreground">{t("replyTo")}</dt>
          <dd className="break-all font-mono">{input.replyTo}</dd>
        </div>
      )}
      {input.message && (
        <div>
          <dt className="sr-only">{t("message")}</dt>
          <dd className="mt-1 whitespace-pre-wrap rounded-md bg-muted/60 p-2 leading-relaxed">
            {input.message}
          </dd>
        </div>
      )}
    </dl>
  );

  let footer: React.ReactNode = null;
  if (part.state === "approval-requested" && !part.approval.isAutomatic) {
    footer = (
      <div className="flex items-center gap-2 border-t border-border/70 px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-[0.65rem] text-muted-foreground">{t("hint")}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRespond(part.approval.id, false)}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRespond(part.approval.id, true)}
          className="pixel-btn-primary inline-flex items-center gap-1.5 !px-2.5 !py-1 !text-[0.6rem] disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> {t("send")}
        </button>
      </div>
    );
  } else if (part.state === "approval-responded" || part.state === "input-available") {
    footer = (
      <div className="flex items-center gap-2 border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("sending")}
      </div>
    );
  } else if (part.state === "output-available") {
    const output = part.output;
    footer = (
      <div
        className={cn(
          "flex items-center gap-2 border-t border-border/70 px-3 py-2 text-xs font-medium",
          output.delivered ? "text-green-700 dark:text-green-400" : "text-destructive",
        )}
      >
        {output.delivered ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {output.delivered
          ? "simulated" in output && output.simulated
            ? t("simulated")
            : t("sent", { name: ownerName })
          : t("notSent")}
      </div>
    );
  } else if (part.state === "output-denied") {
    footer = (
      <div className="flex items-center gap-2 border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" /> {t("denied")}
      </div>
    );
  }

  return (
    <div className="my-2 overflow-hidden rounded-lg border-2 border-primary/30 bg-card shadow-[3px_3px_0_0_var(--shadow-color)]">
      {header}
      {body}
      {footer}
    </div>
  );
}
