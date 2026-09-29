import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const crawlerStatuses = [
  "idle",
  "running",
  "paused",
  "rate_limited",
  "error",
] as const;
export type CrawlerStatus = (typeof crawlerStatuses)[number];

export const queueStatuses = [
  "queued",
  "processing",
  "done",
  "failed",
  "skipped",
] as const;
export type QueueStatus = (typeof queueStatuses)[number];

export const processedResults = [
  "followed",
  "skipped_already_following",
  "skipped_already_processed",
  "failed",
] as const;
export type ProcessedResult = (typeof processedResults)[number];

export const crawlerState = pgTable("crawler_state", {
  ownerGithubUserId: bigint("owner_github_user_id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 32 }).notNull().default("idle"),
  currentUsername: varchar("current_username", { length: 39 }),
  currentGithubUserId: bigint("current_github_user_id", { mode: "number" }),
  delaySeconds: integer("delay_seconds").notNull().default(30),
  queueLimit: integer("queue_limit").notNull().default(50),
  /** Preferred run length in minutes. `0` = unlimited. */
  runDurationMinutes: integer("run_duration_minutes").notNull().default(0),
  /** Absolute end time for the current run; null = no time limit. */
  runEndsAt: timestamp("run_ends_at", { withTimezone: true }),
  /** When the current Running session began; null when not running. */
  runStartedAt: timestamp("run_started_at", { withTimezone: true }),
  /** Frozen elapsed ms for the last run (kept while Paused / Idle). */
  runElapsedMs: integer("run_elapsed_ms").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  lastError: text("last_error"),
  tokenCipher: text("token_cipher"),
  workerId: varchar("worker_id", { length: 64 }),
  workerLeaseUntil: timestamp("worker_lease_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crawlerQueue = pgTable(
  "crawler_queue",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    githubUserId: bigint("github_user_id", { mode: "number" }).notNull(),
    username: varchar("username", { length: 39 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    discoveredAt: timestamp("discovered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("crawler_queue_owner_user_uidx").on(
      table.ownerGithubUserId,
      table.githubUserId,
    ),
    index("crawler_queue_owner_status_discovered_idx").on(
      table.ownerGithubUserId,
      table.status,
      table.discoveredAt,
    ),
  ],
);

export const crawlerProcessed = pgTable(
  "crawler_processed",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    githubUserId: bigint("github_user_id", { mode: "number" }).notNull(),
    username: varchar("username", { length: 39 }).notNull(),
    result: varchar("result", { length: 64 }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /**
     * When set, this user's followers were already used to seed the next
     * queue wave (wave expand happens only after the current queue drains).
     */
    networkExpandedAt: timestamp("network_expanded_at", { withTimezone: true }),
  },
  (table) => [
    unique("crawler_processed_owner_user_uidx").on(
      table.ownerGithubUserId,
      table.githubUserId,
    ),
    index("crawler_processed_owner_expand_idx").on(
      table.ownerGithubUserId,
      table.networkExpandedAt,
      table.processedAt,
    ),
  ],
);

export const crawlerLogs = pgTable(
  "crawler_logs",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    githubUserId: bigint("github_user_id", { mode: "number" }),
    username: varchar("username", { length: 39 }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("crawler_logs_owner_created_idx").on(
      table.ownerGithubUserId,
      table.createdAt,
    ),
  ],
);

/**
 * Cached result of comparing an owned fork's default branch against its
 * upstream parent's. Populated by the "Check" action in the fork cleanup
 * view so repeated visits don't re-hit GitHub's compare endpoint.
 */
export const forkChecks = pgTable(
  "fork_checks",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    /** Upstream repo's full name, or null when GitHub no longer reports one. */
    parent: varchar("parent", { length: 200 }),
    /** Commits on the fork upstream doesn't have. Null when undetermined. */
    aheadBy: integer("ahead_by"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("fork_checks_owner_full_name_uidx").on(
      table.ownerGithubUserId,
      table.fullName,
    ),
    index("fork_checks_owner_checked_idx").on(
      table.ownerGithubUserId,
      table.checkedAt,
    ),
  ],
);

/** True once a fork has been deliberately archived or deleted from cleanup, kept for audit. */
export const forkActionLog = pgTable(
  "fork_action_log",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    action: varchar("action", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("fork_action_log_owner_created_idx").on(
      table.ownerGithubUserId,
      table.createdAt,
    ),
  ],
);

export const followerSnapshot = pgTable(
  "follower_snapshot",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    followerGithubUserId: bigint("follower_github_user_id", {
      mode: "number",
    }).notNull(),
    login: varchar("login", { length: 39 }).notNull(),
    avatarUrl: text("avatar_url"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("follower_snapshot_owner_follower_uidx").on(
      table.ownerGithubUserId,
      table.followerGithubUserId,
    ),
    index("follower_snapshot_owner_idx").on(table.ownerGithubUserId),
  ],
);

export const followerEventKinds = ["gained", "lost"] as const;
export type FollowerEventKind = (typeof followerEventKinds)[number];

export const followerEvent = pgTable(
  "follower_event",
  {
    id: serial("id").primaryKey(),
    ownerGithubUserId: bigint("owner_github_user_id", {
      mode: "number",
    }).notNull(),
    followerGithubUserId: bigint("follower_github_user_id", {
      mode: "number",
    }).notNull(),
    login: varchar("login", { length: 39 }).notNull(),
    avatarUrl: text("avatar_url"),
    kind: varchar("kind", { length: 8 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("follower_event_owner_occurred_idx").on(
      table.ownerGithubUserId,
      table.occurredAt,
    ),
  ],
);

export const followerWatchState = pgTable("follower_watch_state", {
  ownerGithubUserId: bigint("owner_github_user_id", {
    mode: "number",
  }).primaryKey(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  baselineCompletedAt: timestamp("baseline_completed_at", {
    withTimezone: true,
  }),
});
