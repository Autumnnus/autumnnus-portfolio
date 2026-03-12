export const PROJECT_SORT_OPTIONS = [
  "recent",
  "oldest",
  "featured",
  "status",
] as const;
export type ProjectSort = (typeof PROJECT_SORT_OPTIONS)[number];
export const DEFAULT_PROJECT_SORT: ProjectSort = "recent";

export function ensureProjectSort(value?: string): ProjectSort {
  if (PROJECT_SORT_OPTIONS.some((option) => option === value)) {
    return value as ProjectSort;
  }
  return DEFAULT_PROJECT_SORT;
}

export const BLOG_SORT_OPTIONS = ["recent", "oldest", "featured"] as const;
export type BlogSort = (typeof BLOG_SORT_OPTIONS)[number];
export const DEFAULT_BLOG_SORT: BlogSort = "recent";

export function ensureBlogSort(value?: string): BlogSort {
  if (BLOG_SORT_OPTIONS.some((option) => option === value)) {
    return value as BlogSort;
  }
  return DEFAULT_BLOG_SORT;
}
