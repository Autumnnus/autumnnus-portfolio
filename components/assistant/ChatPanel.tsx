"use client";

import type { AssistantUIMessage } from "@/lib/ai/agent/portfolio-agent";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import {
  ArrowUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseChatError } from "./lib";
import { AssistantMessage, UserMessage } from "./MessageView";
import PixelLeaf from "./PixelLeaf";

const MAX_CHARS = 1_500;

export type PageKind = "home" | "projects" | "project" | "blog" | "post" | "work" | "other";

function EmptyState({
  ownerName,
  pageKind,
  onPick,
}: {
  ownerName: string;
  pageKind: PageKind;
  onPick: (text: string) => void;
}) {
  const t = useTranslations("Assistant");
  const key = pageKind === "other" ? "home" : pageKind;
  const suggestions = (t.raw(`suggestions.${key}`) as string[]) ?? [];

  return (
    <div className="flex h-full flex-col justify-end gap-4 px-1 pb-2">
      <div className="space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/10 text-primary shadow-[3px_3px_0_0_var(--shadow-color)]">
          <PixelLeaf className="h-6 w-6" animated />
        </div>
        <p className="text-base font-semibold">{t("greetingTitle")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("greeting", { name: ownerName })}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-all hover:-translate-y-px hover:border-primary/60 hover:shadow-[2px_2px_0_0_var(--shadow-color)]"
          >
            <span>{suggestion}</span>
            <ArrowUp className="h-3.5 w-3.5 rotate-45 text-muted-foreground transition-colors group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPanel({
  threadId,
  locale,
  ownerName,
  retentionDays,
  pageKind,
  pathnameRef,
  open,
  expanded,
  onToggleExpanded,
  onClose,
  onNewThread,
  initialPrompt,
  onInitialPromptConsumed,
}: {
  threadId: string;
  locale: string;
  ownerName: string;
  retentionDays: number;
  pageKind: PageKind;
  pathnameRef: React.RefObject<string>;
  open: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
  onNewThread: (forget: boolean) => void;
  initialPrompt: string | null;
  onInitialPromptConsumed: () => void;
}) {
  const t = useTranslations("Assistant");
  const [input, setInput] = useState("");
  const [restoring, setRestoring] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AssistantUIMessage>({
        api: "/api/assistant/chat",
        // The server owns the history: send only the newest message.
        prepareSendMessagesRequest: ({ id, messages, body }) => ({
          body: {
            id,
            message: messages.at(-1),
            locale,
            pathname: (body as { pathname?: string } | undefined)?.pathname,
          },
        }),
      }),
    [locale],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
    clearError,
    addToolApprovalResponse,
  } = useChat<AssistantUIMessage>({
    id: threadId,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    throttle: 40,
  });

  const busy = status === "submitted" || status === "streaming";

  // Restore the conversation from the server (source of truth).
  useEffect(() => {
    let cancelled = false;
    setRestoring(true);
    fetch(`/api/assistant/thread?id=${encodeURIComponent(threadId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data: { messages?: AssistantUIMessage[] }) => {
        if (!cancelled && data.messages?.length) setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => !cancelled && setRestoring(false));
    return () => {
      cancelled = true;
    };
  }, [threadId, setMessages]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      clearError();
      stickToBottom.current = true;
      void sendMessage(
        { text: value.slice(0, MAX_CHARS) },
        { body: { pathname: pathnameRef.current } },
      );
      setInput("");
    },
    [busy, clearError, sendMessage, pathnameRef],
  );

  // A suggestion picked from the launcher nudge.
  useEffect(() => {
    if (initialPrompt && !restoring) {
      submit(initialPrompt);
      onInitialPromptConsumed();
    }
  }, [initialPrompt, restoring, submit, onInitialPromptConsumed]);

  // Auto-scroll while streaming unless the visitor scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages, status]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Auto-grow textarea.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const errorCode = parseChatError(error);
  const lastMessage = messages.at(-1);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b-2 border-border bg-card/80 px-3 py-2.5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-md border-2 border-primary/40 bg-primary/10 text-primary">
          <PixelLeaf className="h-5 w-5" animated={busy} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[0.7rem] uppercase tracking-wider">{t("name")}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t("subtitle", { name: ownerName })}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onNewThread(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("newChat")}
                aria-label={t("newChat")}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(t("forgetConfirm"))) onNewThread(true);
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                title={t("forget")}
                aria-label={t("forget")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleExpanded}
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:block"
            title={expanded ? t("collapse") : t("expand")}
            aria-label={expanded ? t("collapse") : t("expand")}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={t("close")}
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        data-lenis-prevent
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      >
        {messages.length === 0 ? (
          restoring ? null : (
            <EmptyState ownerName={ownerName} pageKind={pageKind} onPick={submit} />
          )
        ) : (
          <div className={cn("mx-auto flex flex-col gap-5", expanded && "max-w-2xl")}>
            {messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  locale={locale}
                  ownerName={ownerName}
                  streaming={busy && message.id === lastMessage?.id}
                  busy={busy}
                  onApproval={(id, approved) => addToolApprovalResponse({ id, approved })}
                />
              ),
            )}
            {status === "submitted" && lastMessage?.role === "user" && (
              <AssistantMessage
                message={{ id: "pending", role: "assistant", parts: [] }}
                locale={locale}
                ownerName={ownerName}
                streaming
                busy
                onApproval={() => {}}
              />
            )}
            {errorCode && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                <span className="flex-1">
                  {t.has(`errors.${errorCode}`) ? t(`errors.${errorCode}`) : t("errors.generic")}
                </span>
                {errorCode !== "rate_limited" && errorCode !== "disabled" && (
                  <button
                    type="button"
                    onClick={() => {
                      const lastUser = [...messages].reverse().find((m) => m.role === "user");
                      if (!lastUser) return;
                      const text = lastUser.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                      setMessages(messages.filter((m) => m.id !== lastUser.id));
                      submit(text);
                    }}
                    className="rounded-md border border-destructive/30 px-2 py-0.5 text-xs font-medium hover:bg-destructive/10"
                  >
                    {t("errors.retry")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="border-t-2 border-border bg-card/80 px-3 pb-3 pt-2.5"
      >
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border-2 border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/60",
            expanded && "mx-auto max-w-2xl",
          )}
        >
          <label htmlFor="assistant-input" className="sr-only">
            {t("placeholder")}
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={input}
            rows={1}
            maxLength={MAX_CHARS}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit(input);
              }
            }}
            placeholder={t("placeholder")}
            className="max-h-[132px] flex-1 resize-none bg-transparent py-1 text-[0.925rem] leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-transform active:scale-95"
              aria-label={t("stop")}
              title={t("stop")}
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--shadow-color)] transition-all active:translate-x-px active:translate-y-px active:shadow-none disabled:opacity-40 disabled:shadow-none"
              aria-label={t("send")}
              title={t("send")}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[0.65rem] text-muted-foreground/80">
          {input.length > MAX_CHARS * 0.8
            ? `${input.length}/${MAX_CHARS}`
            : t("disclaimer", { days: retentionDays })}
        </p>
      </form>
    </div>
  );
}
