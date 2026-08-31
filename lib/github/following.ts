import type { GitHubApiSimpleUser, GitHubUserSummary } from "@/types/github";
import { githubPaginate } from "@/lib/github/client";
import { mapSimpleUser } from "@/lib/github/followers";

export async function listFollowing(
  accessToken: string,
): Promise<GitHubUserSummary[]> {
  const users = await githubPaginate<GitHubApiSimpleUser>(
    "/user/following",
    accessToken,
  );
  return users.map(mapSimpleUser);
}
