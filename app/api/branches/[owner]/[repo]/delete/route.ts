import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import {
  isValidGitHubRepoName,
  isValidGitHubUsername,
  normalizeUsername,
} from "@/lib/github/validate";
import { getRepoDetails } from "@/lib/github/cleanup-repos";
import { deleteBranch } from "@/lib/github/branches";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }

  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  const { owner: rawOwner, repo: rawRepo } = await context.params;
  const owner = normalizeUsername(decodeURIComponent(rawOwner));
  const repo = decodeURIComponent(rawRepo).trim();
  if (!isValidGitHubUsername(owner) || !isValidGitHubRepoName(repo)) {
    return jsonError("validation", 422);
  }

  let branch: string;
  try {
    const body = (await request.json()) as { branch?: string };
    branch = String(body.branch ?? "").trim();
  } catch {
    return jsonError("validation", 422);
  }
  if (!branch) {
    return jsonError("validation", 422);
  }

  try {
    await withGitHubRetry(auth.session, auth.token, async (token) => {
      const details = await getRepoDetails(token, owner, repo);
      await deleteBranch(token, owner, repo, branch, details.default_branch);
    });
    return NextResponse.json({ ok: true, branch });
  } catch (error) {
    return githubErrorResponse(error);
  }
}
