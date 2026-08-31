import { GitHubApiError } from "@/lib/github/client";
import {
  ReauthRequiredError,
  getValidAccessToken,
  refreshSession,
} from "@/lib/auth/tokens";
import { clearSession, getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/types/auth";

export async function requireAuthenticatedSession(): Promise<{
  token: string;
  session: SessionPayload;
} | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  try {
    return await getValidAccessToken(session);
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      await clearSession();
    }
    return null;
  }
}

export async function withGitHubRetry<T>(
  session: SessionPayload,
  token: string,
  fn: (accessToken: string) => Promise<T>,
): Promise<{ value: T; session: SessionPayload; token: string }> {
  try {
    const value = await fn(token);
    return { value, session, token };
  } catch (error) {
    if (error instanceof GitHubApiError && error.code === "unauthorized") {
      const refreshed = await refreshSession(session);
      const value = await fn(refreshed.token);
      return { value, session: refreshed.session, token: refreshed.token };
    }
    throw error;
  }
}
