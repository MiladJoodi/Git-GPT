import type { GitHubApiSimpleUser, GitHubUserSummary } from "@/types/github";
import { githubPaginate } from "@/lib/github/client";

export function mapSimpleUser(user: GitHubApiSimpleUser): GitHubUserSummary {
  return {
    login: user.login,
    id: user.id,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    name: user.name ?? null,
  };
}

export async function listFollowers(
  accessToken: string,
): Promise<GitHubUserSummary[]> {
  const users = await githubPaginate<GitHubApiSimpleUser>(
    "/user/followers",
    accessToken,
  );
  return users.map(mapSimpleUser);
}
