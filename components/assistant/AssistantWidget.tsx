"use client";

import { cn } from "@/lib/utils";
import { generateId } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatPanel, { type PageKind } from "./ChatPanel";
import PixelLeaf from "./PixelLeaf";

const THREAD_KEY = "autumn.assistant.thread";
const NUDGE_KEY = "autumn.assistant.nudged";

function readThreadId() {
  try {
    const stored = localStorage.getItem(THREAD_KEY);
    if (stored && /^[A-Za-z0-9_-]{8,64}$/.test(stored)) return stored;
  } catch {}
  const id = generateId();
  try {
    localStorage.setItem(THREAD_KEY, id);
  } catch {}
  return id;
}

function pageKindOf(pathname: string): PageKind {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "tr" || segments[0] === "en") segments.shift();
  const [first, second] = segments;
  if (!first) return "home";
  if (first === "projects") return second ? "project" : "projects";
  if (first === "blog") return second ? "post" : "blog";
  if (first === "work") return "work";
  return "other";
}

export default function AssistantWidget({
  ownerName,
  retentionDays,
}: {
  ownerName: string;
  retentionDays: number;
}) {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  const pathnameRef = useRef(pathname);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const pageKind = pageKindOf(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const openPanel = useCallback((prompt?: string) => {
    setThreadId((current) => current ?? readThreadId());
    setMounted(true);
    setOpen(true);
    setNudge(null);
    if (prompt) setInitialPrompt(prompt);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // ⌘K / Ctrl+K toggles, Esc closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closePanel();
        else openPanel();
      } else if (event.key === "Escape" && open) {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPanel, closePanel]);

  // One gentle, page-aware nudge per session on content pages.
  useEffect(() => {
    if (open || (pageKind !== "project" && pageKind !== "post")) return;
    let already = false;
    try {
      already = sessionStorage.getItem(NUDGE_KEY) === "1";
    } catch {}
    if (already) return;
    const show = setTimeout(() => {
      setNudge(pageKind === "project" ? t("nudge.project") : t("nudge.post"));
      try {
        sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {}
    }, 9000);
    const hide = setTimeout(() => setNudge(null), 19000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pageKind, open, t]);

  // Lock page scroll on mobile while the full-screen sheet is open.
  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 640px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const startNewThread = useCallback(
    (forget: boolean) => {
      if (forget && threadId) {
        void fetch(`/api/assistant/thread?id=${encodeURIComponent(threadId)}`, {
          method: "DELETE",
        });
      }
      const id = generateId();
      try {
        localStorage.setItem(THREAD_KEY, id);
      } catch {}
      setThreadId(id);
    },
    [threadId],
  );

  const shown = { opacity: 1, y: 0, scale: 1, visibility: "visible" as const };
  const hidden = reduceMotion
    ? { opacity: 0, transitionEnd: { visibility: "hidden" as const } }
    : { opacity: 0, y: 12, scale: 0.98, transitionEnd: { visibility: "hidden" as const } };

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {nudge && !open && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex max-w-[16rem] items-start gap-2 rounded-lg border-2 border-border bg-card px-3 py-2 text-sm shadow-[3px_3px_0_0_var(--shadow-color)]"
            >
              <button type="button" onClick={() => openPanel(nudge)} className="text-left hover:text-primary">
                {nudge}
              </button>
              <button
                type="button"
                onClick={() => setNudge(null)}
                className="-mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!open && (
            <motion.button
              ref={launcherRef}
              type="button"
              onClick={() => openPanel()}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { y: 1 }}
              aria-label={t("open")}
              aria-keyshortcuts="Meta+K Control+K"
              className="group flex items-center gap-2 border-[3px] border-foreground bg-card px-3 py-2.5 text-foreground shadow-[4px_4px_0_0_var(--shadow-color)] transition-shadow hover:shadow-[2px_2px_0_0_var(--shadow-color)]"
            >
              <span className="text-primary">
                <PixelLeaf className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" animated />
              </span>
              <span className="hidden font-pixel text-[0.65rem] uppercase tracking-wider sm:inline">
                {t("launcher")}
              </span>
              <kbd className="hidden rounded-sm border border-border bg-muted px-1 font-mono text-[0.6rem] text-muted-foreground lg:inline">
                ⌘K
              </kbd>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Panel — stays mounted after the first open so a running stream
          survives closing it; hidden panels are inert for keyboard/AT. */}
      {mounted && threadId && (
        <motion.section
          role="dialog"
          aria-label={t("name")}
          aria-hidden={!open}
          inert={!open}
          initial={hidden}
          animate={open ? shown : hidden}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "fixed z-[61] flex flex-col overflow-hidden bg-background",
            "inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-xl sm:border-[3px] sm:border-foreground sm:shadow-[6px_6px_0_0_var(--shadow-color)]",
            expanded
              ? "sm:h-[calc(100dvh-3rem)] sm:w-[min(760px,calc(100vw-3rem))]"
              : "sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px]",
            "pb-[env(safe-area-inset-bottom)]",
            !open && "pointer-events-none",
          )}
        >
          <ChatPanel
            key={threadId}
            threadId={threadId}
            locale={locale}
            ownerName={ownerName}
            retentionDays={retentionDays}
            pageKind={pageKind}
            pathnameRef={pathnameRef}
            open={open}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((value) => !value)}
            onClose={closePanel}
            onNewThread={startNewThread}
            initialPrompt={initialPrompt}
            onInitialPromptConsumed={() => setInitialPrompt(null)}
          />
        </motion.section>
      )}
    </>
  );
}
