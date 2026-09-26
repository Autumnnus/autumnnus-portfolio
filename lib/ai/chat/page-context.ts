import { db } from "@/lib/db";
import { blogPost, project } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { AssistantLocale } from "../config";

/**
 * Where the visitor is while chatting. Resolved on the server from the
 * pathname the widget sends (never trusted beyond a strict pattern), so
 * "what stack does this project use?" works without the visitor naming it.
 */

export const pageContextSchema = z.object({
  type: z.enum(["home", "projects", "project", "blog", "post", "work", "other"]),
  path: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
});

export type PageContext = z.infer<typeof pageContextSchema>;

const SAFE_PATH = /^\/[a-zA-Z0-9/_\-.%]*$/;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parsePathname(pathname: string | undefined | null): Omit<PageContext, "title"> | null {
  if (!pathname || pathname.length > 200 || !SAFE_PATH.test(pathname)) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "tr" || segments[0] === "en") segments.shift();
  const path = `/${segments.join("/")}`;

  const [first, second] = segments;
  if (!first) return { type: "home", path };
  if (first === "projects") {
    return second ? { type: "project", path, slug: safeDecode(second) } : { type: "projects", path };
  }
  if (first === "blog") {
    return second ? { type: "post", path, slug: safeDecode(second) } : { type: "blog", path };
  }
  if (first === "work") return { type: "work", path };
  return { type: "other", path };
}

export async function resolvePageContext(
  pathname: string | undefined | null,
  locale: AssistantLocale,
): Promise<PageContext | null> {
  const parsed = parsePathname(pathname);
  if (!parsed?.slug) return parsed;

  try {
    if (parsed.type === "project") {
      const row = await db.query.project.findFirst({
        where: eq(project.slug, parsed.slug),
        columns: { id: true },
        with: { translations: { columns: { language: true, title: true } } },
      });
      if (!row) return { type: "other", path: parsed.path };
      const title =
        row.translations.find((t) => t.language === locale)?.title ?? row.translations[0]?.title;
      return { ...parsed, title };
    }
    if (parsed.type === "post") {
      const row = await db.query.blogPost.findFirst({
        where: and(eq(blogPost.slug, parsed.slug), eq(blogPost.status, "published")),
        columns: { id: true },
        with: { translations: { columns: { language: true, title: true } } },
      });
      if (!row) return { type: "other", path: parsed.path };
      const title =
        row.translations.find((t) => t.language === locale)?.title ?? row.translations[0]?.title;
      return { ...parsed, title };
    }
  } catch (error) {
    console.error("[assistant] page context lookup failed:", error);
  }
  return parsed;
}
