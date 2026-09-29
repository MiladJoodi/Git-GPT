export type FollowerHistoryEntry = {
  githubUserId: number;
  login: string;
  avatarUrl: string | null;
  kind: "gained" | "lost";
  occurredAt: string;
};

export type FollowerSyncResult = {
  isBaseline: boolean;
  watchedCount: number;
  gained: FollowerHistoryEntry[];
  lost: FollowerHistoryEntry[];
};
