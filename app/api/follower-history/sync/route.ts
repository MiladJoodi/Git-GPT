import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { listFollowers } from "@/lib/github/followers";
import { syncFollowerSnapshot } from "@/lib/db/follower-history";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  try {
    const { value: followers } = await withGitHubRetry(
      auth.session,
      auth.token,
      (token) => listFollowers(token),
    );
    const result = await syncFollowerSnapshot(
      auth.session.githubUserId,
      followers,
    );
    return NextResponse.json(result);
  } catch (error) {
    return githubErrorResponse(error);
  }
}
