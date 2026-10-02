import { getAppUrl } from "@/lib/env";

export function isSameOriginRequest(request: Request): boolean {
  let allowed: string;
  try {
    allowed = new URL(getAppUrl()).origin;
  } catch {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin === allowed;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === allowed;
    } catch {
      return false;
    }
  }

  return false;
}
