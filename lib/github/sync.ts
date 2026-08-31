import type {
  GitHubUserSummary,
  RelatedUser,
  SyncPayload,
} from "@/types/github";
import { calculateRelationships } from "@/lib/github/relationships";
import { listFollowers } from "@/lib/github/followers";
import { listFollowing } from "@/lib/github/following";
import { getAuthenticatedUser } from "@/lib/github/user";

export async function syncGitHubGraph(
  accessToken: string,
  githubUserId: number,
): Promise<SyncPayload> {
  const [profile, followers, following] = await Promise.all([
    getAuthenticatedUser(accessToken),
    listFollowers(accessToken),
    listFollowing(accessToken),
  ]);

  if (profile.id !== githubUserId) {
    throw new Error("identity_mismatch");
  }

  const relationships = calculateRelationships(followers, following);
  const mutualLogins = new Set(
    relationships.mutual.map((user) => user.login),
  );

  return {
    profile,
    followers: withFollowerStatus(followers, mutualLogins),
    following: withFollowingStatus(following, mutualLogins),
    counts: {
      followers: profile.followers,
      following: profile.following,
      mutual: relationships.mutual.length,
      notFollowingBack: relationships.notFollowingBack.length,
    },
    syncedAt: Date.now(),
  };
}

function withFollowingStatus(
  users: GitHubUserSummary[],
  mutualLogins: Set<string>,
): RelatedUser[] {
  return users.map((user) => ({
    ...user,
    status: mutualLogins.has(user.login) ? "mutual" : "not_following_back",
  }));
}

function withFollowerStatus(
  users: GitHubUserSummary[],
  mutualLogins: Set<string>,
): RelatedUser[] {
  return users.map((user) => ({
    ...user,
    status: mutualLogins.has(user.login) ? "mutual" : "follows_you",
  }));
}
