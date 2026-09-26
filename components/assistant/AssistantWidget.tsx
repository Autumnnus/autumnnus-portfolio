"use client";

import PixelIcon from "@/components/pixel/PixelIcon";
import { usePixelWipe } from "@/components/pixel/SeasonTransition";
import { playSound } from "@/lib/pixel/sound";
import { cn } from "@/lib/utils";
import { generateId } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AutumnMascot from "./AutumnMascot";
import ChatPanel, { type PageKind, type PanelView } from "./ChatPanel";

const THREAD_KEY = "autumn.assistant.thread";
const NUDGE_KEY = "autumn.assistant.nudges";
/** Pages that get a nudge, and how many a visitor sees per session at most. */
const NUDGE_KINDS = ["project", "post", "work"] as const;
const NUDGE_LIMIT = 6;

type Nudge = { text: string; prompt: string };

function readNudged(): string[] {
  try {
    const stored = JSON.parse(sessionStorage.getItem(NUDGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

/**
 * The panel opens and closes with a pixel wipe: cells spill out of the
 * launcher to build the window, and on close they sweep back toward it.
 */
type Phase = "closed" | "opening" | "open" | "closing";

function themeColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    fill: css.getPropertyValue("--card").trim() || "#fff6e5",
    edge: css.getPropertyValue("--primary").trim() || "#e0692e",
  };
}

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
  /** Null when chats are kept indefinitely (auto-delete off). */
  retentionDays: number | null;
}) {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const pathname = usePathname();
  const pixelWipe = usePixelWipe();

  const [phase, setPhase] = useState<Phase>("closed");
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [view, setView] = useState<PanelView>("chat");

  const pathnameRef = useRef(pathname);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pageKind = pageKindOf(pathname);
  const open = phase === "open";

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const openPanel = useCallback((prompt?: string) => {
    setThreadId((current) => current ?? readThreadId());
    setMounted(true);
    setNudge(null);
    if (prompt) setInitialPrompt(prompt);
    setPhase((current) => (current === "closed" ? "opening" : current));
  }, []);

  const closePanel = useCallback(() => {
    setPhase((current) => (current === "open" ? "closing" : current));
  }, []);

  // Run the wipe for the phase we just entered.
  useEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const opening = phase === "opening";
    const panel = panelRef.current;
    if (!panel) {
      setPhase(opening ? "open" : "closed");
      return;
    }
    // Include the 4px pixel frame that sits outside the panel on desktop.
    const pad = window.matchMedia("(min-width: 640px)").matches ? 4 : 0;
    const box = panel.getBoundingClientRect();
    const rect = {
      left: box.left - pad,
      top: box.top - pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    };
    const launcher = launcherRef.current?.getBoundingClientRect();
    const origin = opening
      ? launcher
        ? { x: launcher.left + launcher.width / 2, y: launcher.top + launcher.height / 2 }
        : { x: box.right, y: box.bottom }
      : { x: box.left, y: box.top };
    playSound(opening ? "open" : "close");
    pixelWipe({
      rect,
      origin,
      ...themeColors(),
      cell: 10,
      coverMs: opening ? 260 : 240,
      revealMs: opening ? 320 : 300,
      onCovered: () => setPhase(opening ? "open" : "closed"),
      onDone: () => {
        if (!opening) launcherRef.current?.focus();
      },
    });
  }, [phase, pixelWipe]);

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

  // A page-aware nudge on each content page (once per page, a few per
  // session), rotating through phrasings so repeats don't feel canned.
  useEffect(() => {
    if (phase !== "closed") return;
    const kind = NUDGE_KINDS.find((k) => k === pageKind);
    if (!kind) return;
    const nudged = readNudged();
    if (nudged.includes(pathname) || nudged.length >= NUDGE_LIMIT) return;
    const options = t.raw(`nudge.${kind}`) as Nudge[];
    if (!options?.length) return;
    const show = setTimeout(() => {
      setNudge(options[nudged.length % options.length]);
      try {
        sessionStorage.setItem(NUDGE_KEY, JSON.stringify([...nudged, pathname]));
      } catch {}
    }, 6000);
    const hide = setTimeout(() => setNudge(null), 21000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pageKind, pathname, phase, t]);

  // Navigating away takes the previous page's nudge with it.
  useEffect(() => {
    setNudge(null);
  }, [pathname]);

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

  const selectThread = useCallback((id: string) => {
    try {
      localStorage.setItem(THREAD_KEY, id);
    } catch {}
    setThreadId(id);
    setView("chat");
    playSound("open");
  }, []);

  const showLauncher = phase === "closed" || phase === "opening";
  const panelVisible = phase === "open" || phase === "closing";

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 p-1 sm:bottom-6 sm:right-6">
        {nudge && phase === "closed" && (
          <div className="launcher-pop flex max-w-[16rem] items-start gap-2 bg-card px-3 py-2 text-sm pixel-frame-sm">
            <button type="button" onClick={() => openPanel(nudge.prompt)} className="text-left hover:text-ember">
              {nudge.text}
            </button>
            <button
              type="button"
              onClick={() => setNudge(null)}
              className="-mr-1 p-1 text-muted-foreground hover:text-foreground"
              aria-label={t("close")}
            >
              <PixelIcon name="close" className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        {showLauncher && (
          <button
            ref={launcherRef}
            type="button"
            onClick={() => openPanel()}
            aria-label={t("open")}
            aria-keyshortcuts="Meta+K Control+K"
            className={cn(
              "launcher-pop pixel-button pixel-button-sm h-12 gap-2.5 px-2.5 sm:pr-3.5",
              phase === "opening" && "launcher-jump",
            )}
          >
            <span className="launcher-bob flex h-8 w-8 items-center justify-center">
              <AutumnMascot className="h-7 w-7" />
            </span>
            <span className="hidden text-base sm:inline">{t("launcher")}</span>
            <kbd className="hidden px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground pixel-chip lg:inline">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Panel — stays mounted after the first open so a running stream
          survives closing it; hidden panels are inert for keyboard/AT. */}
      {mounted && threadId && (
        <section
          ref={panelRef}
          role="dialog"
          aria-label={t("name")}
          aria-hidden={!open}
          inert={!open}
          style={{ visibility: panelVisible ? "visible" : "hidden" }}
          className={cn(
            "fixed z-[61] flex flex-col overflow-hidden bg-background",
            "inset-0 sm:inset-auto sm:bottom-6 sm:right-6",
            "sm:shadow-[0_-4px_0_0_var(--px-ink),0_4px_0_0_var(--px-ink),-4px_0_0_0_var(--px-ink),4px_0_0_0_var(--px-ink),10px_10px_0_0_var(--px-drop)]",
            expanded
              ? "sm:h-[calc(100dvh-3rem)] sm:w-[min(760px,calc(100vw-3rem))]"
              : "sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px]",
            "pb-[env(safe-area-inset-bottom)]",
            !panelVisible && "pointer-events-none",
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
            onSelectThread={selectThread}
            view={view}
            onViewChange={setView}
            initialPrompt={initialPrompt}
            onInitialPromptConsumed={() => setInitialPrompt(null)}
          />
        </section>
      )}
    </>
  );
}
