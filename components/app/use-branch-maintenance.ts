"use client";

import type { BulkUnfollowProgress, UnfollowErrorCode } from "@/types/github";
import { runBulkUnfollow } from "@/lib/github/bulk";

type DeleteResponse = { ok?: boolean; error?: string };

function throwFromError(status: number, code: string | undefined): never {
  const resolved = (status === 401 ? "unauthorized" : (code ?? "failed")) as UnfollowErrorCode;
  const error = new Error(resolved) as Error & { code: UnfollowErrorCode };
  error.code = resolved;
  throw error;
}

export async function deleteBranchOnce(
  owner: string,
  repo: string,
  branch: string,
): Promise<void> {
  const response = await fetch(
    `/api/branches/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/delete`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ branch }),
    },
  );
  const body = (await response.json()) as DeleteResponse;
  if (!response.ok) {
    throwFromError(response.status, body.error);
  }
}

export function runBranchDeleteMany(
  owner: string,
  repo: string,
  branches: string[],
  onProgress: (progress: BulkUnfollowProgress) => void,
  signal?: AbortSignal,
) {
  return runBulkUnfollow(
    branches,
    (branch) => deleteBranchOnce(owner, repo, branch),
    {
      concurrency: 1,
      delayMs: 400,
      onProgress,
      signal,
    },
  );
}
