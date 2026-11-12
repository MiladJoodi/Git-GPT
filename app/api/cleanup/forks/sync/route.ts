import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import {
  assertOwnedFork,
  ForkActionError,
  ForkSyncError,
  syncFork,
} from "@/lib/github/fork-cleanup";
import { parseRepoFullName } from "@/lib/github/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  let fullName: string;
  try {
    const body = (await request.json()) as { fullName?: string };
    fullName = String(body.fullName ?? "");
  } catch {
    return jsonError("validation", 422);
  }

  const parsed = parseRepoFullName(fullName);
  if (!parsed) {
    return jsonError("validation", 422);
  }

  try {
    const { value } = await withGitHubRetry(
      auth.session,
      auth.token,
      async (token) => {
        await assertOwnedFork(
          token,
          auth.session.login,
          parsed.owner,
          parsed.repo,
        );
        return syncFork(token, parsed.owner, parsed.repo);
      },
    );
    return NextResponse.json({ ok: true, fullName, mergeType: value.mergeType });
  } catch (error) {
    if (error instanceof ForkActionError) {
      return jsonError("forbidden", 403);
    }
    if (error instanceof ForkSyncError) {
      return jsonError(`sync_${error.reason}`, 409);
    }
    return githubErrorResponse(error);
  }
}
