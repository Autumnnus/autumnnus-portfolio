"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { CSSProperties, useEffect, useState } from "react";
import AutumnMascot from "./AutumnMascot";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
}

/**
 * The visitor's past conversations (the API only ever returns threads owned
 * by their signed cookie). Deleting asks inline, then the row crumbles away.
 */
export default function ThreadHistory({
  currentId,
  retentionDays,
  onOpen,
  onDeleted,
}: {
  currentId: string;
  retentionDays: number | null;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("Assistant.history");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/assistant/threads", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { threads: [] }))
      .then((data: { threads?: ThreadSummary[] }) => {
        if (!cancelled) setThreads(data.threads ?? []);
      })
      .catch(() => !cancelled && setThreads([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = (id: string) => {
    setConfirming(null);
    setRemoving((ids) => [...ids, id]);
    playSound("close");
    void fetch(`/api/assistant/thread?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
    setTimeout(() => {
      setThreads((list) => list?.filter((thread) => thread.id !== id) ?? null);
      onDeleted(id);
    }, 360);
  };

  return (
    <div className="history-in flex min-h-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="font-pixel text-lg font-bold">{t("title")}</h3>
        {retentionDays !== null && (
          <span className="text-xs text-muted-foreground">
            {t("retention", { days: retentionDays })}
          </span>
        )}
      </div>

      {threads === null ? (
        <div className="flex flex-col gap-3 p-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-card pixel-frame-sm" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center pixel-slot">
            <AutumnMascot mood="think" className="h-12 w-12" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 p-1">
          {threads.map((thread, index) => {
            const current = thread.id === currentId;
            return (
              <li
                key={thread.id}
                className={cn(
                  "px-rise",
                  removing.includes(thread.id) && "history-crumble",
                )}
                style={{ "--d": `${index * 50}ms` } as CSSProperties}
              >
                <div
                  className={cn(
                    "flex items-center gap-1 bg-card pixel-frame-sm",
                    current && "bg-slot-active",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(thread.id)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left transition-colors duration-100 hover:bg-primary/15"
                  >
                    <span className="block truncate text-sm font-medium">
                      {thread.title || t("untitled")}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 font-pixel text-[11px] text-muted-foreground">
                      <span>{format.relativeTime(new Date(thread.lastMessageAt), now)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t("messages", { count: thread.messageCount })}</span>
                      {current && <span className="text-ember uppercase">{t("current")}</span>}
                    </span>
                  </button>

                  {confirming === thread.id ? (
                    <div className="flex shrink-0 items-center gap-1.5 pr-2">
                      <span className="font-pixel text-[11px] text-muted-foreground">
                        {t("confirmPrompt")}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(thread.id)}
                        className="bg-destructive px-2 py-1 font-pixel text-xs text-white"
                      >
                        {t("confirm")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="px-2 py-1 font-pixel text-xs hover:bg-primary/20"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(thread.id)}
                      aria-label={t("delete")}
                      title={t("delete")}
                      className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-100 hover:bg-destructive/15 hover:text-destructive"
                    >
                      <PixelIcon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
