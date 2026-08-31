import type { SessionPayload } from "@/types/auth";
import { refreshAccessToken, tokensFromResponse } from "@/lib/auth/oauth";
import { isAccessTokenFresh, setSession } from "@/lib/auth/session";

export class ReauthRequiredError extends Error {
  constructor() {
    super("reauth_required");
    this.name = "ReauthRequiredError";
  }
}

export async function getValidAccessToken(
  session: SessionPayload,
): Promise<{ token: string; session: SessionPayload }> {
  if (isAccessTokenFresh(session)) {
    return { token: session.accessToken, session };
  }

  return refreshSession(session);
}

export async function refreshSession(
  session: SessionPayload,
): Promise<{ token: string; session: SessionPayload }> {
  if (!session.refreshToken) {
    throw new ReauthRequiredError();
  }

  if (
    session.refreshTokenExpiresAt &&
    session.refreshTokenExpiresAt <= Date.now()
  ) {
    throw new ReauthRequiredError();
  }

  try {
    const response = await refreshAccessToken(session.refreshToken);
    const tokens = tokensFromResponse(response);
    if (!tokens) {
      throw new ReauthRequiredError();
    }

    const nextSession: SessionPayload = {
      ...session,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? session.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt:
        tokens.refreshTokenExpiresAt ?? session.refreshTokenExpiresAt,
    };

    await setSession(nextSession);
    return { token: nextSession.accessToken, session: nextSession };
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      throw error;
    }
    throw new ReauthRequiredError();
  }
}
