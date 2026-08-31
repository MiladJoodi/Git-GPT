function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL");
  }
  return url;
}

export function getGitHubOAuthConfig() {
  return {
    clientId: required("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID),
    clientSecret: required(
      "GITHUB_CLIENT_SECRET",
      process.env.GITHUB_CLIENT_SECRET,
    ),
    appUrl: getAppUrl(),
    callbackUrl: `${getAppUrl()}/api/auth/github/callback`,
  };
}

export function tryGetSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }
  return secret;
}

export function getSessionSecret(): string {
  const secret = tryGetSessionSecret();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters",
    );
  }
  return secret;
}

export function isSecureCookie(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return appUrl.startsWith("https://");
  }
  return process.env.NODE_ENV === "production";
}
