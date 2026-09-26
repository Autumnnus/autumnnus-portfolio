"use client";

import type {
  AssistantUIMessage,
  RouteDataPart,
  SourcesDataPart,
} from "@/lib/ai/agent/portfolio-agent";
import { cn } from "@/lib/utils";
import { isToolUIPart } from "ai";
import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { useMemo } from "react";
import ActivityTimeline, { RouteChip } from "./ActivityTimeline";
import ApprovalCard from "./ApprovalCard";
import AutumnMascot from "./AutumnMascot";
import { collectSources, linkCitations, localizeHref, type ToolPart } from "./lib";
import Markdown from "./Markdown";
import ToolCard from "./ToolCards";
import { useTypewriter } from "./useTypewriter";

function Sources({
  data,
  order,
  locale,
}: {
  data: SourcesDataPart | undefined;
  order: string[];
  locale: string;
}) {
  const t = useTranslations("Assistant.sources");
  const items = data?.items ?? [];
  if (!items.length) return null;

  const cited = order
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is SourcesDataPart["items"][number] => Boolean(item));
  const extra = items.filter((item) => !order.includes(item.key));

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className="font-pixel text-[0.55rem] uppercase tracking-wider text-muted-foreground">
        {t("title")}
      </span>
      {[...cited, ...extra].map((item) => {
        const index = order.indexOf(item.key);
        return (
          <NextLink
            key={item.key}
            href={localizeHref(item.path, locale)}
            title={item.verified ? t("verified") : undefined}
            className={cn(
              "inline-flex max-w-[14rem] items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[0.65rem] transition-colors hover:border-primary hover:text-primary",
              index >= 0 ? "border-border bg-card" : "border-dashed border-border/80 text-muted-foreground",
            )}
          >
            {index >= 0 ? (
              <span className="font-mono font-bold text-primary">{index + 1}</span>
            ) : (
              <span className="sr-only">{t("alsoUsed")}</span>
            )}
            <span className="truncate">{item.title}</span>
            {item.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />}
          </NextLink>
        );
      })}
    </div>
  );
}

export function UserMessage({
  message,
  animate = false,
}: {
  message: AssistantUIMessage;
  animate?: boolean;
}) {
  const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
  return (
    <div className="flex justify-end pr-1">
      <p
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words bg-primary px-3.5 py-2 text-[0.925rem] leading-relaxed text-primary-foreground pixel-frame-sm",
          animate && "chat-msg-in-right",
        )}
      >
        {text}
      </p>
    </div>
  );
}

export function AssistantMessage({
  message,
  locale,
  ownerName,
  streaming,
  onApproval,
  busy,
  animate = false,
}: {
  message: AssistantUIMessage;
  locale: string;
  ownerName: string;
  streaming: boolean;
  onApproval: (approvalId: string, approved: boolean) => void;
  busy: boolean;
  animate?: boolean;
}) {
  const t = useTranslations("Assistant");

  const { route, sourcesData, toolParts, text } = useMemo(() => {
    let routePart: RouteDataPart | undefined;
    let sourcesPart: SourcesDataPart | undefined;
    const tools: ToolPart[] = [];
    let body = "";
    for (const part of message.parts) {
      if (part.type === "data-route") routePart = part.data;
      else if (part.type === "data-sources") sourcesPart = part.data;
      else if (part.type === "text") body += (body ? "\n\n" : "") + part.text;
      else if (isToolUIPart(part)) tools.push(part as ToolPart);
    }
    return { route: routePart, sourcesData: sourcesPart, toolParts: tools, text: body };
  }, [message.parts]);

  const known = useMemo(() => collectSources(message), [message]);
  const { body, order } = useMemo(() => linkCitations(text, known), [text, known]);

  const contactParts = toolParts.filter(
    (part): part is Extract<ToolPart, { type: "tool-contactOwner" }> =>
      part.type === "tool-contactOwner",
  );
  const mentionsContact = /iletişim|contact|e-?posta|email|linkedin|ulaş|reach/i.test(text);
  const metadata = message.metadata;
  const thinking = streaming && !body && !toolParts.length;
  const typed = useTypewriter(body, streaming);
  const mood = thinking ? "think" : typed.revealing ? "talk" : "idle";

  return (
    <div className={cn("group/message flex gap-2.5", animate && "chat-msg-in-left")}>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center pixel-slot">
        <AutumnMascot mood={mood} className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <ActivityTimeline
          route={route}
          parts={toolParts}
          streaming={streaming}
          latencyMs={metadata?.latencyMs}
        />

        {thinking && (
          <div className="flex items-center gap-2.5 py-1.5" aria-live="polite">
            <span className="flex items-end gap-1 bg-card px-2 py-1.5 pixel-frame-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="chat-dot h-1.5 w-1.5 bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            <span className="font-pixel text-xs text-muted-foreground">{t("thinking")}</span>
          </div>
        )}

        {typed.text && (
          <Markdown
            text={typed.text}
            locale={locale}
            sources={known}
            streaming={streaming || typed.revealing}
          />
        )}

        {toolParts.map((part) => (
          <ToolCard
            key={part.toolCallId}
            part={part}
            locale={locale}
            showContact={mentionsContact}
          />
        ))}

        {contactParts.map((part) => (
          <ApprovalCard
            key={part.toolCallId}
            part={part}
            ownerName={ownerName}
            onRespond={onApproval}
            disabled={busy}
          />
        ))}

        <Sources data={sourcesData} order={order} locale={locale} />

        {!streaming && metadata?.model && (
          <div className="mt-1.5 flex items-center gap-2 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
            {route && !toolParts.length && <RouteChip route={route} />}
            <span className="font-mono text-[0.6rem] text-muted-foreground/80">
              {metadata.model}
              {metadata.outputTokens ? ` · ${metadata.outputTokens} tok` : ""}
              {metadata.latencyMs ? ` · ${(metadata.latencyMs / 1000).toFixed(1)}s` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
