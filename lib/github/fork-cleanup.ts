import type { ForkCheck } from "@/types/cleanup";
import { GitHubApiError, githubRequest } from "@/lib/github/client";
import { getRepoDetails } from "@/lib/github/cleanup-repos";

const enc = encodeURIComponent;

/**
 * Counts commits on the fork's default branch that upstream doesn't have.
 * Only the default branch is compared; other branches on the fork are not.
 */
export async function checkFork(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<ForkCheck> {
  const fullName = `${owner}/${repo}`;
  const fork = await getRepoDetails(accessToken, owner, repo);
  const parent = fork.parent;
  const checkedAt = new Date().toISOString();
  if (!parent) {
    return { fullName, parent: null, aheadBy: null, checkedAt };
  }

  const [parentOwner, parentName] = parent.full_name.split("/");
  const basehead = `${enc(parent.default_branch)}...${enc(fork.owner.login)}:${enc(fork.default_branch)}`;

  try {
    const response = await githubRequest(
      `/repos/${enc(parentOwner)}/${enc(parentName)}/compare/${basehead}?per_page=1`,
      accessToken,
    );
    const body = (await response.json()) as { ahead_by?: number };
    return {
      fullName,
      parent: parent.full_name,
      aheadBy: typeof body.ahead_by === "number" ? body.ahead_by : null,
      checkedAt,
    };
  } catch (error) {
    // Upstream deleted, made private, or the branches no longer share history.
    if (
      error instanceof GitHubApiError &&
      (error.code === "not_found" || error.code === "validation")
    ) {
      return { fullName, parent: parent.full_name, aheadBy: null, checkedAt };
    }
    throw error;
  }
}

export class ForkActionError extends Error {
  readonly code = "blocked";
  constructor(reason: "not_a_fork" | "not_owned") {
    super(reason);
    this.name = "ForkActionError";
  }
}

/**
 * Archive and delete are destructive, so the server re-checks on every call
 * that the target is a fork owned by the signed-in user. The client can't
 * talk it into touching anything else.
 */
export async function assertOwnedFork(
  accessToken: string,
  login: string,
  owner: string,
  repo: string,
): Promise<void> {
  if (owner.toLowerCase() !== login.toLowerCase()) {
    throw new ForkActionError("not_owned");
  }
  const details = await getRepoDetails(accessToken, owner, repo);
  if (!details.fork) {
    throw new ForkActionError("not_a_fork");
  }
}

export async function setRepoArchived(
  accessToken: string,
  owner: string,
  repo: string,
  archived: boolean,
): Promise<void> {
  await githubRequest(`/repos/${enc(owner)}/${enc(repo)}`, accessToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived }),
  });
}

export async function archiveRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<void> {
  await setRepoArchived(accessToken, owner, repo, true);
}

export async function unarchiveRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<void> {
  await setRepoArchived(accessToken, owner, repo, false);
}

export async function deleteRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<void> {
  await githubRequest(`/repos/${enc(owner)}/${enc(repo)}`, accessToken, {
    method: "DELETE",
  });
}

export type ForkSyncResult = {
  mergeType: "fast-forward" | "merge" | "none";
  message: string;
};

export class ForkSyncError extends Error {
  readonly reason: "no_parent" | "diverged" | "conflict";
  constructor(reason: "no_parent" | "diverged" | "conflict") {
    super(reason);
    this.name = "ForkSyncError";
    this.reason = reason;
  }
}

export async function syncFork(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<ForkSyncResult> {
  const details = await getRepoDetails(accessToken, owner, repo);
  if (!details.parent) {
    throw new ForkSyncError("no_parent");
  }

  const check = await checkFork(accessToken, owner, repo);
  if (check.aheadBy === null || check.aheadBy > 0) {
    throw new ForkSyncError("diverged");
  }

  try {
    const response = await githubRequest(
      `/repos/${enc(owner)}/${enc(repo)}/merge-upstream`,
      accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: details.default_branch }),
      },
    );
    const body = (await response.json()) as {
      merge_type?: string;
      message?: string;
    };
    const mergeType =
      body.merge_type === "fast-forward" || body.merge_type === "merge"
        ? body.merge_type
        : "none";
    return { mergeType, message: body.message ?? "" };
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 409) {
      throw new ForkSyncError("conflict");
    }
    throw error;
  }
}
