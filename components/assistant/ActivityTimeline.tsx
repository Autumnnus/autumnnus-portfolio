"use client";

import type { RouteDataPart } from "@/lib/ai/agent/portfolio-agent";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  FolderGit2,
  Loader2,
  Mail,
  Search,
  TriangleAlert,
  UserRound,
  Zap,
  Brain,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ToolPart } from "./lib";

/**
 * "How I found this" — a live, collapsible trace of the agent loop:
 * the System One routing decision, every tool call, and the retrieval
 * pipeline's numbers (lexical/vector candidates → Jev-judged → kept).
 */

const TOOL_ICON = {
  "tool-searchKnowledge": Search,
  "tool-listProjects": FolderGit2,
  "tool-getProject": FolderGit2,
  "tool-listPosts": FileText,
  "tool-getPost": FileText,
  "tool-getCareer": Briefcase,
  "tool-getProfile": UserRound,
  "tool-contactOwner": Mail,
} as const;

function isRunning(part: ToolPart) {
  return (
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    (part.state === "output-available" && part.preliminary === true)
  );
}

function StepLine({ part }: { part: ToolPart }) {
  const t = useTranslations("Assistant.activity");
  const Icon = TOOL_ICON[part.type] ?? Search;
  const running = isRunning(part);
  const failed = part.state === "output-error";

  let label: string = t(part.type.slice("tool-".length) as "listProjects");
  let detail: string | null = null;

  if (part.type === "tool-searchKnowledge") {
    const query = part.input?.query ?? "…";
    label = running ? t("searching", { query }) : t("searched", { query });
    if (part.state === "output-available" && !part.preliminary && part.output.trace) {
      const trace = part.output.trace;
      detail = t("searchStats", {
        kept: trace.kept,
        candidates: trace.lexical + trace.vector,
      });
      if (trace.judge) {
        detail += ` · ${t("judged", { provider: trace.judge === "jev" ? "Jev" : "Gemini", count: trace.judged, ms: trace.ms.judge })}`;
      }
    }
  } else if (part.type === "tool-getProject" && part.state === "output-available" && part.output.found) {
    detail = part.output.project.title;
  } else if (part.type === "tool-getPost" && part.state === "output-available" && part.output.found) {
    detail = part.output.post.title;
  } else if (part.type === "tool-listProjects" && part.state === "output-available") {
    detail = t("count", { count: part.output.total });
  } else if (part.type === "tool-listPosts" && part.state === "output-available") {
    detail = t("count", { count: part.output.total });
  }

  return (
    <li className="flex items-start gap-2 py-1">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
          failed
            ? "border-destructive/40 text-destructive"
            : running
              ? "border-primary/40 text-primary"
              : "border-border text-muted-foreground",
        )}
      >
        {running ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : failed ? (
          <TriangleAlert className="h-3 w-3" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-foreground/80">
          {failed ? t("failed") : label}
        </span>
        {detail && (
          <span className="block truncate font-mono text-[0.65rem] text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
      {!running && !failed && <Check className="mt-1 h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />}
    </li>
  );
}

export function RouteChip({ route }: { route: RouteDataPart }) {
  const t = useTranslations("Assistant.activity");
  const deep = route.tier === "deep";
  const Icon = deep ? Brain : Zap;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide",
        deep
          ? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
      title={
        route.evaluator
          ? t("routedBy", {
              provider: route.evaluator.provider === "jev" ? "Jev" : route.evaluator.provider,
              ms: route.evaluator.ms,
            })
          : t("heuristic")
      }
    >
      <Icon className="h-2.5 w-2.5" />
      {deep ? t("routeDeep") : t("routeFast")}
      {route.evaluator && <span className="opacity-60">· {route.evaluator.ms}ms</span>}
    </span>
  );
}

export default function ActivityTimeline({
  route,
  parts,
  streaming,
  latencyMs,
}: {
  route?: RouteDataPart;
  parts: ToolPart[];
  streaming: boolean;
  latencyMs?: number;
}) {
  const t = useTranslations("Assistant.activity");
  const reduceMotion = useReducedMotion();
  const [manual, setManual] = useState<boolean | null>(null);
  const steps = parts.filter((part) => part.type !== "tool-contactOwner");
  if (!steps.length) return null;

  const open = manual ?? streaming;

  return (
    <div className="mb-2 rounded-lg border border-border/70 bg-muted/40">
      <button
        type="button"
        onClick={() => setManual(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        {streaming ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : (
          <Search className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-[0.7rem] font-medium text-muted-foreground">
          {streaming ? t("working") : t("show")} · {t("steps", { count: steps.length })}
          {!streaming && latencyMs ? ` · ${(latencyMs / 1000).toFixed(1)}s` : ""}
        </span>
        {route && <RouteChip route={route} />}
        <ChevronDown
          className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-border/60 px-2.5 py-1"
          >
            {steps.map((part) => (
              <StepLine key={part.toolCallId} part={part} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
