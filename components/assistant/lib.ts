import type { AssistantUIMessage, SourcesDataPart } from "@/lib/ai/agent/portfolio-agent";
import { isToolUIPart } from "ai";

export type AssistantPart = AssistantUIMessage["parts"][number];
export type ToolPart = Extract<AssistantPart, { type: `tool-${string}` }>;

export interface ClientSource {
  key: string;
  type: SourcesDataPart["items"][number]["type"];
  title: string;
  path: string;
}

/** Every citable entity returned by this message's tools, in first-seen order. */
export function collectSources(message: AssistantUIMessage): Map<string, ClientSource> {
  const registry = new Map<string, ClientSource>();
  const add = (source: ClientSource) => {
    if (source.key && !registry.has(source.key)) registry.set(source.key, source);
  };

  for (const part of message.parts) {
    if (!isToolUIPart(part) || part.state !== "output-available") continue;
    switch (part.type) {
      case "tool-searchKnowledge":
        for (const r of part.output.results) {
          add({ key: r.cite, type: r.type, title: r.title, path: r.path });
        }
        break;
      case "tool-listProjects":
        for (const p of part.output.projects) add({ key: p.cite, type: "project", title: p.title, path: p.path });
        break;
      case "tool-getProject":
        if (part.output.found) {
          const p = part.output.project;
          add({ key: p.cite, type: "project", title: p.title, path: p.path });
        }
        break;
      case "tool-listPosts":
        for (const p of part.output.posts) add({ key: p.cite, type: "blog", title: p.title, path: p.path });
        break;
      case "tool-getPost":
        if (part.output.found) {
          const p = part.output.post;
          add({ key: p.cite, type: "blog", title: p.title, path: p.path });
        }
        break;
      case "tool-getCareer":
        for (const p of part.output.positions) {
          add({ key: p.cite, type: "experience", title: `${p.role} · ${p.company}`, path: "/work" });
        }
        break;
      case "tool-getProfile":
        if (part.output.found) {
          add({ key: "about", type: "profile", title: part.output.profile.name, path: "/" });
        }
        break;
    }
  }
  return registry;
}

export const CITATION = /\[((?:project|post|work):[a-z0-9._-]+|about)\]/gi;

/**
 * Rewrites `[project:slug]` markers into numbered markdown links
 * (`[1](cite:project:slug)`) and drops markers that don't resolve to a
 * source the tools actually returned.
 */
export function linkCitations(text: string, known: Map<string, ClientSource>) {
  const order: string[] = [];
  const body = text.replace(CITATION, (_match, rawKey: string) => {
    const key = rawKey.toLowerCase();
    if (!known.has(key)) return "";
    if (!order.includes(key)) order.push(key);
    return `[${order.indexOf(key) + 1}](cite:${key})`;
  });
  return { body: body.replace(/[ \t]+([.,;:!?])/g, "$1"), order };
}

/** Relative site paths get the locale prefix; everything else is left alone. */
export function localizeHref(href: string, locale: string) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return href.startsWith(`/${locale}/`) || href === `/${locale}` ? href : `/${locale}${href}`;
  }
  return href;
}

export function messageText(message: AssistantUIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function parseChatError(error: Error | undefined): string | null {
  if (!error) return null;
  try {
    const body = JSON.parse(error.message) as { error?: string };
    return body.error ?? "generic";
  } catch {
    if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";
    return "generic";
  }
}
