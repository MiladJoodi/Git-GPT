import type { GitHubTokenResponse } from "@/types/auth";
import { getGitHubOAuthConfig } from "@/lib/env";

const TOKEN_URL = "https://github.com/login/oauth/access_token";
const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const OAUTH_SCOPES = "read:user user:follow offline_access";

export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const { clientId, callbackUrl } = getGitHubOAuthConfig();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function postToken(
  body: Record<string, string>,
): Promise<GitHubTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("token_http_error");
  }

  return (await response.json()) as GitHubTokenResponse;
}

export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret, callbackUrl } = getGitHubOAuthConfig();
  return postToken({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl,
    code_verifier: codeVerifier,
  });
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubOAuthConfig();
  return postToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export function tokensFromResponse(response: GitHubTokenResponse): {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
} | null {
  if (!response.access_token || response.error) {
    return null;
  }

  const now = Date.now();
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt:
      typeof response.expires_in === "number"
        ? now + response.expires_in * 1000
        : undefined,
    refreshTokenExpiresAt:
      typeof response.refresh_token_expires_in === "number"
        ? now + response.refresh_token_expires_in * 1000
        : undefined,
  };
}
