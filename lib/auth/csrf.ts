import { getAppUrl } from "@/lib/env";

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    const allowed = new URL(getAppUrl()).origin;
    return origin === allowed;
  } catch {
    return false;
  }
}
