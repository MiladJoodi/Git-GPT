import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
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
import { listBranchesWithMergeStatus } from "@/lib/github/branches";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  try {
    const { value } = await withGitHubRetry(auth.session, auth.token, async (token) => {
      const details = await getRepoDetails(token, owner, repo);
      const branches = await listBranchesWithMergeStatus(
        token,
        owner,
        repo,
        details.default_branch,
      );
      return { defaultBranch: details.default_branch, branches };
    });
    return NextResponse.json(value);
  } catch (error) {
    return githubErrorResponse(error);
  }
}
