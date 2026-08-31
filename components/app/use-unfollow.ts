"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type {
  BulkUnfollowProgress,
  RelatedUser,
  UnfollowErrorCode,
} from "@/types/github";
import { runBulkUnfollow } from "@/lib/github/bulk";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { useGithubData } from "@/components/app/github-data-provider";
import { useI18n } from "@/components/i18n/i18n-provider";

type ActionResponse = {
  ok?: boolean;
  username?: string;
  error?: string;
  retryAt?: number | null;
};

async function postAction(path: string, username: string): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const body = (await response.json()) as ActionResponse;
  if (response.status === 401) {
    const error = new Error("unauthorized") as Error & { code: UnfollowErrorCode };
    error.code = "unauthorized";
    throw error;
  }

  if (!response.ok) {
    const code = (body.error ?? "failed") as UnfollowErrorCode;
    const error = new Error(code) as Error & { code: UnfollowErrorCode };
    error.code = code;
    throw error;
  }
}

export function useFollowActions() {
  const router = useRouter();
  const { t } = useI18n();
  const { removeFollowing, addFollowing, data } = useGithubData();
  const [pending, setPending] = useState<string | null>(null);

  function errorMessage(code: string) {
    return t(API_ERROR_KEYS[code] ?? "errorFailed");
  }

  async function unfollowOne(username: string) {
    setPending(username);
    try {
      await postAction("/api/github/unfollow", username);
      removeFollowing([username]);
      toast.success(t("toastUnfollowed", { login: username }));
      return true;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "failed";
      if (code === "unauthorized") {
        router.replace("/login?error=session_expired");
        return false;
      }
      toast.error(errorMessage(code));
      return false;
    } finally {
      setPending(null);
    }
  }

  async function followOne(user: RelatedUser) {
    setPending(user.login);
    try {
      await postAction("/api/github/follow", user.login);
      addFollowing([user]);
      toast.success(t("toastFollowed", { login: user.login }));
      return true;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "failed";
      if (code === "unauthorized") {
        router.replace("/login?error=session_expired");
        return false;
      }
      toast.error(errorMessage(code));
      return false;
    } finally {
      setPending(null);
    }
  }

  return { unfollowOne, followOne, pending, data };
}

export async function unfollowMany(
  usernames: string[],
  onProgress: (progress: BulkUnfollowProgress) => void,
  signal?: AbortSignal,
) {
  return runBulkUnfollow(
    usernames,
    (username) => postAction("/api/github/unfollow", username),
    {
      concurrency: 3,
      onProgress,
      signal,
    },
  );
}
