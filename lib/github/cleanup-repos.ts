import type { ForkRepo, StarredRepo } from "@/types/cleanup";
import { githubPaginateWithQuery, githubRequest } from "@/lib/github/client";

type ApiRepo = {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
  archived: boolean;
  fork: boolean;
  created_at: string;
  pushed_at: string | null;
  default_branch: string;
  parent?: { full_name: string; default_branch: string } | null;
};

type ApiStarred = { starred_at: string; repo: ApiRepo };

export async function listStarredRepos(
  accessToken: string,
): Promise<StarredRepo[]> {
  const items = await githubPaginateWithQuery<ApiStarred>(
    "/user/starred?sort=created&direction=asc",
    accessToken,
    100,
    { Accept: "application/vnd.github.star+json" },
  );

  return items.map(({ starred_at, repo }) => ({
    fullName: repo.full_name,
    owner: repo.owner.login,
    name: repo.name,
    description: repo.description,
    htmlUrl: repo.html_url,
    stars: repo.stargazers_count,
    language: repo.language,
    archived: repo.archived,
    pushedAt: repo.pushed_at,
    starredAt: starred_at,
  }));
}

export async function listOwnedForks(accessToken: string): Promise<ForkRepo[]> {
  const repos = await githubPaginateWithQuery<ApiRepo>(
    "/user/repos?affiliation=owner&sort=pushed&direction=desc",
    accessToken,
  );

  return repos
    .filter((repo) => repo.fork)
    .map((repo) => ({
      fullName: repo.full_name,
      owner: repo.owner.login,
      name: repo.name,
      description: repo.description,
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      archived: repo.archived,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      defaultBranch: repo.default_branch,
    }));
}

export async function getRepoDetails(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<ApiRepo> {
  const response = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    accessToken,
  );
  return (await response.json()) as ApiRepo;
}

export type { ApiRepo };
