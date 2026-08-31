import { redirect } from "next/navigation";
import type { SyncPayload } from "@/types/github";
import { GitHubApiError } from "@/lib/github/client";
import { syncGitHubGraph } from "@/lib/github/sync";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { ReauthRequiredError } from "@/lib/auth/tokens";
import { clearSession } from "@/lib/auth/session";

export type GraphLoadResult = {
  data: SyncPayload | null;
  error: string | null;
  retryAt: number | null;
};

export async function loadGithubGraph(): Promise<GraphLoadResult> {
  const auth = await requireAuthenticatedSession();
  if (!auth) {
    redirect("/login?error=session_expired");
  }

  try {
    const { value } = await withGitHubRetry(
      auth.session,
      auth.token,
      (token) => syncGitHubGraph(token, auth.session.githubUserId),
    );
    return { data: value, error: null, retryAt: null };
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      await clearSession();
      redirect("/login?error=session_expired");
    }

    if (error instanceof GitHubApiError) {
      return {
        data: null,
        error: error.code,
        retryAt: error.rateLimit?.resetAt ?? null,
      };
    }

    return {
      data: null,
      error: "failed",
      retryAt: null,
    };
  }
}
