"use client";

import type { BulkUnfollowProgress, UnfollowErrorCode } from "@/types/github";
import type { ForkCheck } from "@/types/cleanup";
import { runBulkUnfollow } from "@/lib/github/bulk";

type CheckResponse = { check?: ForkCheck; error?: string };
type ActionResponse = { ok?: boolean; error?: string };

function throwFromError(status: number, code: string | undefined): never {
  const resolved = (status === 401 ? "unauthorized" : (code ?? "failed")) as UnfollowErrorCode;
  const error = new Error(resolved) as Error & { code: UnfollowErrorCode };
  error.code = resolved;
  throw error;
}

export async function checkForkOnce(fullName: string): Promise<ForkCheck> {
  const response = await fetch("/api/cleanup/forks/check", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ fullName }),
  });
  const body = (await response.json()) as CheckResponse;
  if (!response.ok || !body.check) {
    throwFromError(response.status, body.error);
  }
  return body.check;
}

export type ForkCleanupAction = "archive" | "unarchive" | "delete";

async function postForkAction(
  fullName: string,
  action: ForkCleanupAction,
): Promise<void> {
  const response = await fetch("/api/cleanup/forks/action", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, action }),
  });
  const body = (await response.json()) as ActionResponse;
  if (!response.ok) {
    throwFromError(response.status, body.error);
  }
}

export async function archiveForkOnce(fullName: string): Promise<void> {
  await postForkAction(fullName, "archive");
}

export async function unarchiveForkOnce(fullName: string): Promise<void> {
  await postForkAction(fullName, "unarchive");
}

export async function deleteForkOnce(fullName: string): Promise<void> {
  await postForkAction(fullName, "delete");
}

export type ForkSyncMergeType = "fast-forward" | "merge" | "none";

export async function syncForkOnce(fullName: string): Promise<ForkSyncMergeType> {
  const response = await fetch("/api/cleanup/forks/sync", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ fullName }),
  });
  const body = (await response.json()) as {
    ok?: boolean;
    mergeType?: ForkSyncMergeType;
    error?: string;
  };
  if (!response.ok) {
    throwFromError(response.status, body.error);
  }
  return body.mergeType ?? "none";
}

export function runForkActionMany(
  fullNames: string[],
  action: ForkCleanupAction,
  onProgress: (progress: BulkUnfollowProgress) => void,
  signal?: AbortSignal,
) {
  return runBulkUnfollow(
    fullNames,
    (fullName) => postForkAction(fullName, action),
    {
      concurrency: 1,
      delayMs: 550,
      onProgress,
      signal,
    },
  );
}
