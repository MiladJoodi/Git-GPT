import type {
  GitHubUserSummary,
  RelatedUser,
  RelationshipResult,
} from "@/types/github";

export function calculateRelationships(
  followers: GitHubUserSummary[],
  following: GitHubUserSummary[],
): RelationshipResult {
  const followerLogins = new Set(followers.map((user) => user.login));
  const followingLogins = new Set(following.map((user) => user.login));

  const mutual: RelatedUser[] = [];
  const notFollowingBack: RelatedUser[] = [];

  for (const user of following) {
    if (followerLogins.has(user.login)) {
      mutual.push({ ...user, status: "mutual" });
    } else {
      notFollowingBack.push({ ...user, status: "not_following_back" });
    }
  }

  const followersOnly: RelatedUser[] = followers
    .filter((user) => !followingLogins.has(user.login))
    .map((user) => ({ ...user, status: "follows_you" as const }));

  return { mutual, notFollowingBack, followersOnly };
}
