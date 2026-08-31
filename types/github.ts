export type GitHubApiAuthenticatedUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
};

export type GitHubApiSimpleUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string | null;
};

export type GitHubUser = {
  login: string;
  id: number;
  avatarUrl: string;
  htmlUrl: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
};

export type GitHubUserSummary = {
  login: string;
  id: number;
  avatarUrl: string;
  htmlUrl: string;
  name: string | null;
};

export type RelationshipStatus = "mutual" | "not_following_back" | "follows_you";

export type RelatedUser = GitHubUserSummary & {
  status: RelationshipStatus;
};

export type RelationshipResult = {
  mutual: RelatedUser[];
  notFollowingBack: RelatedUser[];
  followersOnly: RelatedUser[];
};

export type GitHubApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "network"
  | "unknown";

export type UnfollowErrorCode =
  | "unauthorized"
  | "rate_limited"
  | "not_found"
  | "validation"
  | "failed";

export type UnfollowResult = {
  username: string;
  ok: boolean;
  error?: UnfollowErrorCode;
};

export type BulkUnfollowProgress = {
  total: number;
  sent: number;
  remaining: number;
  succeeded: number;
  failed: number;
  inFlight: number;
  current: string[];
};

export type BulkUnfollowResult = {
  succeeded: string[];
  failed: Array<{ username: string; error: UnfollowErrorCode }>;
  aborted: string[];
  abortReason?: "unauthorized" | "rate_limited" | "cancelled";
};

export function emptyBulkProgress(total = 0): BulkUnfollowProgress {
  return {
    total,
    sent: 0,
    remaining: total,
    succeeded: 0,
    failed: 0,
    inFlight: 0,
    current: [],
  };
}

export type GitHubRateLimit = {
  limit: number | null;
  remaining: number | null;
  resetAt: number | null;
  retryAfterSeconds: number | null;
};

export type SyncPayload = {
  profile: GitHubUser;
  followers: RelatedUser[];
  following: RelatedUser[];
  counts: {
    followers: number;
    following: number;
    mutual: number;
    notFollowingBack: number;
  };
  syncedAt: number;
};
