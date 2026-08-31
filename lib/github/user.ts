import type {
  GitHubApiAuthenticatedUser,
  GitHubUser,
} from "@/types/github";
import { githubRequest } from "@/lib/github/client";

export function mapAuthenticatedUser(
  user: GitHubApiAuthenticatedUser,
): GitHubUser {
  return {
    login: user.login,
    id: user.id,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    name: user.name,
    bio: user.bio,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
  };
}

export async function getAuthenticatedUser(
  accessToken: string,
): Promise<GitHubUser> {
  const response = await githubRequest("/user", accessToken);
  const body = (await response.json()) as GitHubApiAuthenticatedUser;
  return mapAuthenticatedUser(body);
}
