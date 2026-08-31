import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { clearSession } from "@/lib/auth/session";
import { ReauthRequiredError } from "@/lib/auth/tokens";
import { followUser } from "@/lib/github/follow";
import { isValidGitHubUsername, normalizeUsername } from "@/lib/github/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("validation", 422);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { username?: unknown }).username !== "string"
  ) {
    return jsonError("validation", 422);
  }

  const username = normalizeUsername((body as { username: string }).username);
  if (!isValidGitHubUsername(username)) {
    return jsonError("validation", 422);
  }

  try {
    await withGitHubRetry(auth.session, auth.token, (token) =>
      followUser(token, username),
    );
    return NextResponse.json({ ok: true, username });
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      await clearSession();
      return jsonError("unauthorized", 401);
    }
    return githubErrorResponse(error);
  }
}
