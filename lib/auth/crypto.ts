import { CompactEncrypt, compactDecrypt } from "jose";
import { getSessionSecret } from "@/lib/env";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<Uint8Array | null> {
  try {
    const secret = getSessionSecret();
    const digest = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(secret),
    );
    return new Uint8Array(digest);
  } catch {
    return null;
  }
}

export async function encryptJson(payload: unknown): Promise<string> {
  const key = await getKey();
  if (!key) {
    throw new Error("SESSION_SECRET is not configured");
  }
  const encoded = encoder.encode(JSON.stringify(payload));
  return new CompactEncrypt(encoded)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

export async function decryptJson<T>(token: string): Promise<T | null> {
  try {
    const key = await getKey();
    if (!key) {
      return null;
    }
    const { plaintext } = await compactDecrypt(token, key);
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    return null;
  }
}
