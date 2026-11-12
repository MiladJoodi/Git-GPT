import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { listOwnedRepos } from "@/lib/github/branches";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  try {
    const { value } = await withGitHubRetry(auth.session, auth.token, (token) =>
      listOwnedRepos(token),
    );
    return NextResponse.json({ repositories: value });
  } catch (error) {
    return githubErrorResponse(error);
  }
}
