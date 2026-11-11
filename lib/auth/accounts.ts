import { cookies } from "next/headers";
import type { SessionPayload } from "@/types/auth";
import { decryptJson, encryptJson } from "@/lib/auth/crypto";
import {
  expiredCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/cookies";
import { readSessionFromValue } from "@/lib/auth/session-cookie";

export type StoredAccount = SessionPayload & { addedAt: number };

export const ACCOUNTS_COOKIE = "gfm_accounts";
export const ACCOUNTS_MAX = 5;

function decodeAccounts(value: string | undefined): StoredAccount[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredAccount =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as StoredAccount).githubUserId === "number" &&
        typeof (item as StoredAccount).accessToken === "string",
    );
  } catch {
    return [];
  }
}

export async function listAccounts(): Promise<StoredAccount[]> {
  const store = await cookies();
  return decodeAccounts(store.get(ACCOUNTS_COOKIE)?.value);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionFromValue(store.get(SESSION_COOKIE)?.value);
}

/** Adds the current session to the saved account list (dedup by user id). */
export async function saveCurrentAccount(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) return;
  const store = await cookies();
  const accounts = decodeAccounts(store.get(ACCOUNTS_COOKIE)?.value).filter(
    (account) => account.githubUserId !== session.githubUserId,
  );
  accounts.unshift({ ...session, addedAt: Date.now() });
  store.set(
    ACCOUNTS_COOKIE,
    await encryptJson(accounts.slice(0, ACCOUNTS_MAX)),
    sessionCookieOptions(),
  );
}

export async function setAccounts(accounts: StoredAccount[]): Promise<void> {
  const store = await cookies();
  if (accounts.length === 0) {
    store.set(ACCOUNTS_COOKIE, "", expiredCookieOptions());
    return;
  }
  store.set(
    ACCOUNTS_COOKIE,
    await encryptJson(accounts.slice(0, ACCOUNTS_MAX)),
    sessionCookieOptions(),
  );
}

/**
 * Replaces the active session with a stored account. Tokens are refreshed
 * on demand by the normal API paths, so we swap the payload as-is.
 */
export async function switchToAccount(githubUserId: number): Promise<SessionPayload | null> {
  const accounts = await listAccounts();
  const target = accounts.find(
    (account) => account.githubUserId === githubUserId,
  );
  if (!target) return null;
  const { addedAt: _addedAt, ...session } = target;
  const store = await cookies();
  store.set(SESSION_COOKIE, await encryptJson(session), sessionCookieOptions());
  return session;
}

export async function removeAccount(githubUserId: number): Promise<void> {
  const accounts = await listAccounts();
  await setAccounts(
    accounts.filter((account) => account.githubUserId !== githubUserId),
  );
}
