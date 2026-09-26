import type { KnowledgeSourceType } from "../knowledge/documents";

/**
 * Citation keys.
 *
 * Every entity the agent can talk about has a short, human-readable key the
 * model uses for inline citations (`[project:autumnnus]`). The widget turns
 * known keys into numbered source chips and silently drops unknown ones, so a
 * hallucinated citation can never render as a link.
 */

export interface SourceRef {
  key: string;
  type: KnowledgeSourceType;
  title: string;
  path: string;
}

export function citeKey(
  type: KnowledgeSourceType,
  { slug, id }: { slug?: string | null; id?: string },
): string {
  switch (type) {
    case "project":
      return `project:${slug}`;
    case "blog":
      return `post:${slug}`;
    case "experience":
      return `work:${(id ?? "").slice(0, 8)}`;
    case "profile":
      return "about";
  }
}

/** Search hits only carry the path; derive the key from it. */
export function citeKeyFromPath(
  type: KnowledgeSourceType,
  path: string,
  sourceId: string,
): string {
  const slug = path.split("/").filter(Boolean)[1];
  return citeKey(type, { slug, id: sourceId });
}

export const CITATION_PATTERN = /\[((?:project|post|work):[a-z0-9._-]+|about)\]/gi;
