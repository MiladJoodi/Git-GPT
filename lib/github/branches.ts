import type { BranchInfo, OwnedRepoSummary } from "@/types/branches";
import {
  GitHubApiError,
  githubPaginate,
  githubPaginateWithQuery,
  githubRequest,
} from "@/lib/github/client";

const enc = encodeURIComponent;

type ApiRepo = {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  default_branch: string;
  fork: boolean;
  archived: boolean;
};

type ApiBranch = {
  name: string;
  commit: { sha: string };
  protected: boolean;
};

type ApiCompare = {
  status: "identical" | "ahead" | "behind" | "diverged";
  ahead_by: number;
  behind_by: number;
};

export async function listOwnedRepos(
  accessToken: string,
): Promise<OwnedRepoSummary[]> {
  const repos = await githubPaginateWithQuery<ApiRepo>(
    "/user/repos?affiliation=owner&sort=full_name",
    accessToken,
  );

  return repos.map((repo) => ({
    fullName: repo.full_name,
    owner: repo.owner.login,
    name: repo.name,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
    fork: repo.fork,
    archived: repo.archived,
  }));
}

async function compareBranch(
  accessToken: string,
  owner: string,
  repo: string,
  defaultBranch: string,
  branch: string,
): Promise<Pick<BranchInfo, "status" | "aheadBy" | "behindBy">> {
  try {
    const response = await githubRequest(
      `/repos/${enc(owner)}/${enc(repo)}/compare/${enc(defaultBranch)}...${enc(branch)}`,
      accessToken,
    );
    const body = (await response.json()) as ApiCompare;
    return { status: body.status, aheadBy: body.ahead_by, behindBy: body.behind_by };
  } catch (error) {
    if (error instanceof GitHubApiError && error.code === "not_found") {
      return { status: null, aheadBy: null, behindBy: null };
    }
    throw error;
  }
}

export async function listBranchesWithMergeStatus(
  accessToken: string,
  owner: string,
  repo: string,
  defaultBranch: string,
  concurrency = 5,
): Promise<BranchInfo[]> {
  const branches = await githubPaginate<ApiBranch>(
    `/repos/${enc(owner)}/${enc(repo)}/branches`,
    accessToken,
  );

  const infos: BranchInfo[] = branches.map((branch) => ({
    name: branch.name,
    sha: branch.commit.sha,
    isDefault: branch.name === defaultBranch,
    isProtected: branch.protected,
    status: null,
    aheadBy: null,
    behindBy: null,
  }));

  const toCompare = infos.filter((info) => !info.isDefault);
  let next = 0;

  async function worker() {
    while (next < toCompare.length) {
      const index = next;
      next += 1;
      const info = toCompare[index];
      const result = await compareBranch(
        accessToken,
        owner,
        repo,
        defaultBranch,
        info.name,
      );
      info.status = result.status;
      info.aheadBy = result.aheadBy;
      info.behindBy = result.behindBy;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, toCompare.length) }, () => worker()),
  );

  return infos;
}

export async function deleteBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  defaultBranch: string,
): Promise<void> {
  if (branch === defaultBranch) {
    throw new GitHubApiError("forbidden", 403);
  }
  await githubRequest(
    `/repos/${enc(owner)}/${enc(repo)}/git/refs/heads/${enc(branch)}`,
    accessToken,
    { method: "DELETE" },
  );
}
