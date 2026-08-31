import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { clearSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/env";
import { jsonError } from "@/lib/api/responses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  await clearSession();

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.redirect(new URL("/login", getAppUrl()), 303);
}
