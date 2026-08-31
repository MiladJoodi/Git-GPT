import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { clearSession } from "@/lib/auth/session";
import { ReauthRequiredError } from "@/lib/auth/tokens";
import { syncGitHubGraph } from "@/lib/github/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  try {
    const { value } = await withGitHubRetry(
      auth.session,
      auth.token,
      (token) => syncGitHubGraph(token, auth.session.githubUserId),
    );
    return NextResponse.json(value);
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      await clearSession();
      return jsonError("unauthorized", 401);
    }
    return githubErrorResponse(error);
  }
}
