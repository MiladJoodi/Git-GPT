import { isSecureCookie } from "@/lib/env";

export const SESSION_COOKIE = "gfm_session";
export const OAUTH_COOKIE = "gfm_oauth";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const OAUTH_MAX_AGE_SECONDS = 60 * 10;

type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

function baseOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge,
  };
}

export function sessionCookieOptions(): CookieOptions {
  return baseOptions(SESSION_MAX_AGE_SECONDS);
}

export function oauthCookieOptions(): CookieOptions {
  return baseOptions(OAUTH_MAX_AGE_SECONDS);
}

export function expiredCookieOptions(): CookieOptions {
  return baseOptions(0);
}
