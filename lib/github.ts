import { GithubRepoStats } from "@/types/contents";

export async function getRepoStats(
  repoUrl?: string,
): Promise<GithubRepoStats | null> {
  if (!repoUrl) return null;

  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(apiUrl, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(
        `Failed to fetch GitHub stats for ${repoUrl}: ${res.status}`,
      );
      return null;
    }

    const data = await res.json();

    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      watchers: data.watchers_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
      language: data.language,
      defaultBranch: data.default_branch,
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return null;
  }
}
