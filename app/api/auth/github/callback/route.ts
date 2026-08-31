import { NextResponse } from "next/server";
import type { OAuthCallbackError } from "@/types/auth";
import { getAppUrl } from "@/lib/env";
import {
  clearOAuthPending,
  getOAuthPending,
  setSession,
} from "@/lib/auth/session";
import { validateOAuthState } from "@/lib/auth/oauth-state";
import { exchangeAuthorizationCode, tokensFromResponse } from "@/lib/auth/oauth";
import { getAuthenticatedUser } from "@/lib/github/user";

export const dynamic = "force-dynamic";

function redirectWithError(error: OAuthCallbackError) {
  const url = new URL("/login", getAppUrl());
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  try {
    if (oauthError === "access_denied") {
      await clearOAuthPending();
      return redirectWithError("denied");
    }

    if (oauthError) {
      await clearOAuthPending();
      return redirectWithError("oauth_failed");
    }

    const pending = await getOAuthPending();
    const stateResult = validateOAuthState(pending, state);

    if (stateResult === "expired") {
      await clearOAuthPending();
      return redirectWithError("expired_state");
    }

    if (stateResult !== "ok") {
      await clearOAuthPending();
      return redirectWithError("invalid_state");
    }

    if (!code) {
      await clearOAuthPending();
      return redirectWithError("missing_code");
    }

    const tokenResponse = await exchangeAuthorizationCode(
      code,
      pending!.codeVerifier,
    );
    const tokens = tokensFromResponse(tokenResponse);
    if (!tokens) {
      await clearOAuthPending();
      return redirectWithError("token_failed");
    }

    const user = await getAuthenticatedUser(tokens.accessToken);
    await setSession({
      githubUserId: user.id,
      login: user.login,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });
    await clearOAuthPending();

    return NextResponse.redirect(new URL("/", getAppUrl()));
  } catch {
    await clearOAuthPending();
    return redirectWithError("oauth_failed");
  }
}
