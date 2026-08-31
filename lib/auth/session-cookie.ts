import type { SessionPayload } from "@/types/auth";
import { decryptJson } from "@/lib/auth/crypto";

export async function readSessionFromValue(
  value: string | undefined,
): Promise<SessionPayload | null> {
  if (!value) {
    return null;
  }
  return decryptJson<SessionPayload>(value);
}
