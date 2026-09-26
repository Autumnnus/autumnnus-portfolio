"use client";

import PixelIcon, { PixelIconName } from "@/components/pixel/PixelIcon";
import type { AssistantUIMessage } from "@/lib/ai/agent/portfolio-agent";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useTranslations } from "next-intl";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AutumnMascot from "./AutumnMascot";
import { parseChatError } from "./lib";
import { AssistantMessage, UserMessage } from "./MessageView";
import ThreadHistory from "./ThreadHistory";
import TypingSparks from "./TypingSparks";

const MAX_CHARS = 1_500;

export type PageKind =
  "home" | "projects" | "project" | "blog" | "post" | "work" | "other";
export type PanelView = "chat" | "history";

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
    <div className="flex h-full flex-col justify-end gap-5 px-1 pb-2">
      <div className="space-y-3">
        <div className="chat-hello flex h-16 w-16 items-center justify-center pixel-slot">
          <AutumnMascot className="h-12 w-12" />
        </div>
        <p
          className="px-rise font-pixel text-xl font-bold"
          style={{ "--d": "120ms" } as CSSProperties}
        >
          {t("greetingTitle")}
        </p>
        <p
          className="px-rise text-sm leading-relaxed text-muted-foreground"
          style={{ "--d": "200ms" } as CSSProperties}
        >
          {t("greeting", { name: ownerName })}
        </p>
      </div>
      <div className="flex flex-col gap-3 p-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            style={{ "--d": `${280 + index * 70}ms` } as CSSProperties}
            className="px-rise group flex items-center justify-between gap-2 bg-card px-3 py-2.5 text-left text-sm transition-transform duration-100 pixel-frame-sm hover:-translate-y-0.5 hover:bg-slot-active"
          >
            <span>{suggestion}</span>
            <PixelIcon
              name="arrowSmall"
              className="h-2.5 w-1.5 text-muted-foreground transition-colors group-hover:text-ember"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderButton({
  icon,
  label,
  onClick,
  pressed,
  className,
}: {
  icon: PixelIconName;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors duration-100 hover:bg-primary/20 hover:text-foreground",
        pressed &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        className,
      )}
    >
      <PixelIcon name={icon} className="h-3.5 w-3.5" />
    </button>
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
  onSelectThread,
  view,
  onViewChange,
  initialPrompt,
  onInitialPromptConsumed,
}: {
  threadId: string;
  locale: string;
  ownerName: string;
  retentionDays: number | null;
  pageKind: PageKind;
  pathnameRef: React.RefObject<string>;
  open: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
  onNewThread: (forget: boolean) => void;
  onSelectThread: (id: string) => void;
  view: PanelView;
  onViewChange: (view: PanelView) => void;
  initialPrompt: string | null;
  onInitialPromptConsumed: () => void;
}) {
  const t = useTranslations("Assistant");
  const [input, setInput] = useState("");
  const [restoring, setRestoring] = useState(true);
  // Messages that already had their entrance (restored, or typed out once),
  // so switching views or threads never replays them.
  const [settledIds, setSettledIds] = useState<Set<string>>(() => new Set());
  const settle = useCallback((ids: string[]) => {
    setSettledIds((previous) => {
      if (ids.every((id) => previous.has(id))) return previous;
      const next = new Set(previous);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);
  const [flights, setFlights] = useState(0);
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
    fetch(`/api/assistant/thread?id=${encodeURIComponent(threadId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data: { messages?: AssistantUIMessage[] }) => {
        if (!cancelled && data.messages?.length) {
          settle(data.messages.map((m) => m.id));
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setRestoring(false));
    return () => {
      cancelled = true;
    };
  }, [threadId, setMessages, settle]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      clearError();
      stickToBottom.current = true;
      setFlights((n) => n + 1);
      playSound("send");
      void sendMessage(
        { text: value.slice(0, MAX_CHARS) },
        { body: { pathname: pathnameRef.current } },
      );
      setInput("");
    },
    [busy, clearError, sendMessage, pathnameRef],
  );

  // User bubbles keep their entrance class just long enough to play it.
  useEffect(() => {
    const fresh = messages
      .filter((m) => m.role === "user" && !settledIds.has(m.id))
      .map((m) => m.id);
    if (!fresh.length) return;
    const timer = setTimeout(() => settle(fresh), 700);
    return () => clearTimeout(timer);
  }, [messages, settledIds, settle]);

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
      <div className="flex items-center gap-3 border-b-4 border-px-ink bg-card px-3 py-2.5">
        <div className="relative flex h-10 w-10 items-center justify-center pixel-slot">
          <AutumnMascot
            mood={
              status === "submitted"
                ? "think"
                : status === "streaming"
                  ? "talk"
                  : "idle"
            }
            className="h-8 w-8"
          />
          <span className="chat-online absolute -bottom-1 -right-1 h-2.5 w-2.5 bg-moss pixel-frame-sm" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-base leading-none font-bold">
            {t("name")}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {t("subtitle", { name: ownerName })}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <HeaderButton
            icon="plus"
            label={t("newChat")}
            onClick={() => {
              if (messages.length) onNewThread(false);
              onViewChange("chat");
            }}
          />
          <HeaderButton
            icon="history"
            label={t("history.open")}
            pressed={view === "history"}
            onClick={() =>
              onViewChange(view === "history" ? "chat" : "history")
            }
          />
          <HeaderButton
            icon={expanded ? "collapse" : "expand"}
            label={expanded ? t("collapse") : t("expand")}
            onClick={onToggleExpanded}
            className="hidden sm:flex"
          />
          <HeaderButton icon="close" label={t("close")} onClick={onClose} />
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <TypingSparks />
        <div
          ref={scrollRef}
          data-lenis-prevent
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        >
          {view === "history" ? (
            <ThreadHistory
              currentId={threadId}
              retentionDays={retentionDays}
              onOpen={(id) =>
                id === threadId ? onViewChange("chat") : onSelectThread(id)
              }
              onDeleted={(id) => {
                if (id === threadId) onNewThread(false);
              }}
            />
          ) : messages.length === 0 ? (
            restoring ? null : (
              <EmptyState
                ownerName={ownerName}
                pageKind={pageKind}
                onPick={submit}
              />
            )
          ) : (
            <div
              className={cn(
                "mx-auto flex flex-col gap-5",
                expanded && "max-w-2xl",
              )}
            >
              {messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage
                    key={message.id}
                    message={message}
                    animate={!settledIds.has(message.id)}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    locale={locale}
                    ownerName={ownerName}
                    streaming={busy && message.id === lastMessage?.id}
                    fresh={!settledIds.has(message.id)}
                    onTyped={() => settle([message.id])}
                    busy={busy}
                    onApproval={(id, approved) =>
                      addToolApprovalResponse({ id, approved })
                    }
                  />
                ),
              )}
              {status === "submitted" && lastMessage?.role === "user" && (
                <AssistantMessage
                  animate
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
                  className="chat-shake flex items-center gap-2 border-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <span className="flex-1">
                    {t.has(`errors.${errorCode}`)
                      ? t(`errors.${errorCode}`)
                      : t("errors.generic")}
                  </span>
                  {errorCode !== "rate_limited" && errorCode !== "disabled" && (
                    <button
                      type="button"
                      onClick={() => {
                        const lastUser = [...messages]
                          .reverse()
                          .find((m) => m.role === "user");
                        if (!lastUser) return;
                        const text = lastUser.parts
                          .map((p) => (p.type === "text" ? p.text : ""))
                          .join("");
                        setMessages(
                          messages.filter((m) => m.id !== lastUser.id),
                        );
                        submit(text);
                      }}
                      className="border-2 border-destructive px-2 py-0.5 font-pixel text-xs hover:bg-destructive/15"
                    >
                      {t("errors.retry")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form
        hidden={view === "history"}
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="border-t-4 border-px-ink bg-card px-3 pb-3 pt-3"
      >
        <div
          className={cn(
            "relative flex items-end gap-2 bg-background px-3 py-2 pixel-frame-sm transition-colors focus-within:bg-slot-active/40",
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
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
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
              className="pixel-button pixel-button-sm pixel-button-icon h-9 w-9"
              aria-label={t("stop")}
              title={t("stop")}
            >
              <PixelIcon name="square" className="h-2.5 w-2.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="pixel-button pixel-button-primary pixel-button-sm pixel-button-icon h-9 w-9"
              aria-label={t("send")}
              title={t("send")}
            >
              <PixelIcon name="arrowUp" className="h-3.5 w-3.5" />
            </button>
          )}

          {flights > 0 && (
            <span
              key={flights}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 bottom-4"
            >
              <span className="chat-fly absolute text-primary">
                <PixelIcon name="leaf" className="h-4 w-4 dark:hidden" />
                <PixelIcon
                  name="snowflake"
                  className="hidden h-4 w-4 dark:block"
                />
              </span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="chat-fly-spark absolute h-1.5 w-1.5 bg-gold"
                  style={{ "--i": i } as CSSProperties}
                />
              ))}
            </span>
          )}
        </div>
        <p className="mt-2 text-center text-[0.65rem] text-muted-foreground/80">
          {input.length > MAX_CHARS * 0.8
            ? `${input.length}/${MAX_CHARS}`
            : t("disclaimer", { days: retentionDays ?? 0 })}
        </p>
      </form>
    </div>
  );
}
