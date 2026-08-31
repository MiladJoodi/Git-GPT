export type SessionPayload = {
  githubUserId: number;
  login: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
};

export type OAuthPending = {
  state: string;
  codeVerifier: string;
  createdAt: number;
};

export type OAuthStateValidation =
  | "ok"
  | "missing_state"
  | "missing_pending"
  | "mismatch"
  | "expired";

export type OAuthCallbackError =
  | "denied"
  | "invalid_state"
  | "expired_state"
  | "missing_code"
  | "token_failed"
  | "oauth_failed"
  | "session_expired"
  | "config";

export type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
};
