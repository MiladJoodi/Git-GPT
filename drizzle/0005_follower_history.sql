CREATE TABLE IF NOT EXISTS "follower_snapshot" (
  "id" serial PRIMARY KEY,
  "owner_github_user_id" bigint NOT NULL,
  "follower_github_user_id" bigint NOT NULL,
  "login" varchar(39) NOT NULL,
  "avatar_url" text,
  "first_seen_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_seen_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "follower_snapshot_owner_follower_uidx"
  ON "follower_snapshot" ("owner_github_user_id", "follower_github_user_id");

CREATE INDEX IF NOT EXISTS "follower_snapshot_owner_idx"
  ON "follower_snapshot" ("owner_github_user_id");

CREATE TABLE IF NOT EXISTS "follower_event" (
  "id" serial PRIMARY KEY,
  "owner_github_user_id" bigint NOT NULL,
  "follower_github_user_id" bigint NOT NULL,
  "login" varchar(39) NOT NULL,
  "avatar_url" text,
  "kind" varchar(8) NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "follower_event_owner_occurred_idx"
  ON "follower_event" ("owner_github_user_id", "occurred_at");

CREATE TABLE IF NOT EXISTS "follower_watch_state" (
  "owner_github_user_id" bigint PRIMARY KEY,
  "last_synced_at" timestamp with time zone,
  "baseline_completed_at" timestamp with time zone
);
