import { cookies } from "next/headers";
import type { OAuthPending, SessionPayload } from "@/types/auth";
import {
  expiredCookieOptions,
  OAUTH_COOKIE,
  oauthCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/cookies";
import { decryptJson, encryptJson } from "@/lib/auth/crypto";
import { readSessionFromValue } from "@/lib/auth/session-cookie";

export { readSessionFromValue };

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionFromValue(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(session: SessionPayload): Promise<void> {
  const store = await cookies();
  const value = await encryptJson(session);
  store.set(SESSION_COOKIE, value, sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", expiredCookieOptions());
}

export async function getOAuthPending(): Promise<OAuthPending | null> {
  const store = await cookies();
  const value = store.get(OAUTH_COOKIE)?.value;
  if (!value) {
    return null;
  }
  return decryptJson<OAuthPending>(value);
}

export async function setOAuthPending(pending: OAuthPending): Promise<void> {
  const store = await cookies();
  const value = await encryptJson(pending);
  store.set(OAUTH_COOKIE, value, oauthCookieOptions());
}

export async function clearOAuthPending(): Promise<void> {
  const store = await cookies();
  store.set(OAUTH_COOKIE, "", expiredCookieOptions());
}

export function isAccessTokenFresh(
  session: SessionPayload,
  skewMs = 60_000,
  now = Date.now(),
): boolean {
  if (!session.accessTokenExpiresAt) {
    return true;
  }
  return session.accessTokenExpiresAt - skewMs > now;
}
