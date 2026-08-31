import type { OAuthPending, OAuthStateValidation } from "@/types/auth";

export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

export function generateRandomString(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkcePair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = base64UrlEncode(verifierBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return {
    codeVerifier,
    codeChallenge: base64UrlEncode(digest),
  };
}

export function validateOAuthState(
  pending: OAuthPending | null | undefined,
  receivedState: string | null | undefined,
  now = Date.now(),
): OAuthStateValidation {
  if (!receivedState) {
    return "missing_state";
  }
  if (!pending) {
    return "missing_pending";
  }
  if (pending.state !== receivedState) {
    return "mismatch";
  }
  if (now - pending.createdAt > OAUTH_STATE_MAX_AGE_MS) {
    return "expired";
  }
  return "ok";
}
