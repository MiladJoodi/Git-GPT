import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  followerEvent,
  followerSnapshot,
  followerWatchState,
} from "@/lib/db/schema";
import type { GitHubUserSummary } from "@/types/github";
import type {
  FollowerHistoryEntry,
  FollowerSyncResult,
} from "@/types/follower-history";

export async function getWatchState(ownerGithubUserId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(followerWatchState)
    .where(eq(followerWatchState.ownerGithubUserId, ownerGithubUserId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFollowerEvents(
  ownerGithubUserId: number,
  limit = 200,
): Promise<FollowerHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(followerEvent)
    .where(eq(followerEvent.ownerGithubUserId, ownerGithubUserId))
    .orderBy(desc(followerEvent.occurredAt), desc(followerEvent.id))
    .limit(limit);

  return rows.map((row) => ({
    githubUserId: row.followerGithubUserId,
    login: row.login,
    avatarUrl: row.avatarUrl,
    kind: row.kind as "gained" | "lost",
    occurredAt: row.occurredAt.toISOString(),
  }));
}

export async function getFollowerEventTotals(
  ownerGithubUserId: number,
): Promise<{ gained: number; lost: number }> {
  const db = getDb();
  const rows = await db
    .select({ kind: followerEvent.kind, count: sql<number>`count(*)::int` })
    .from(followerEvent)
    .where(eq(followerEvent.ownerGithubUserId, ownerGithubUserId))
    .groupBy(followerEvent.kind);

  const totals = { gained: 0, lost: 0 };
  for (const row of rows) {
    if (row.kind === "gained") totals.gained = row.count;
    if (row.kind === "lost") totals.lost = row.count;
  }
  return totals;
}

export async function syncFollowerSnapshot(
  ownerGithubUserId: number,
  currentFollowers: GitHubUserSummary[],
): Promise<FollowerSyncResult> {
  const db = getDb();
  const now = new Date();

  const existingRows = await db
    .select()
    .from(followerSnapshot)
    .where(eq(followerSnapshot.ownerGithubUserId, ownerGithubUserId));
  const existingById = new Map(existingRows.map((row) => [row.followerGithubUserId, row]));
  const currentById = new Map(currentFollowers.map((user) => [user.id, user]));

  const watch = await getWatchState(ownerGithubUserId);
  const isBaseline = !watch?.baselineCompletedAt;

  const gained: FollowerHistoryEntry[] = [];
  const lost: FollowerHistoryEntry[] = [];

  for (const user of currentFollowers) {
    const existing = existingById.get(user.id);
    if (existing) {
      await db
        .update(followerSnapshot)
        .set({ lastSeenAt: now, login: user.login, avatarUrl: user.avatarUrl })
        .where(
          and(
            eq(followerSnapshot.ownerGithubUserId, ownerGithubUserId),
            eq(followerSnapshot.followerGithubUserId, user.id),
          ),
        );
      continue;
    }

    await db.insert(followerSnapshot).values({
      ownerGithubUserId,
      followerGithubUserId: user.id,
      login: user.login,
      avatarUrl: user.avatarUrl,
      firstSeenAt: now,
      lastSeenAt: now,
    });

    if (!isBaseline) {
      await db.insert(followerEvent).values({
        ownerGithubUserId,
        followerGithubUserId: user.id,
        login: user.login,
        avatarUrl: user.avatarUrl,
        kind: "gained",
      });
      gained.push({
        githubUserId: user.id,
        login: user.login,
        avatarUrl: user.avatarUrl,
        kind: "gained",
        occurredAt: now.toISOString(),
      });
    }
  }

  for (const row of existingRows) {
    if (currentById.has(row.followerGithubUserId)) {
      continue;
    }

    await db
      .delete(followerSnapshot)
      .where(
        and(
          eq(followerSnapshot.ownerGithubUserId, ownerGithubUserId),
          eq(followerSnapshot.followerGithubUserId, row.followerGithubUserId),
        ),
      );

    if (!isBaseline) {
      await db.insert(followerEvent).values({
        ownerGithubUserId,
        followerGithubUserId: row.followerGithubUserId,
        login: row.login,
        avatarUrl: row.avatarUrl,
        kind: "lost",
      });
      lost.push({
        githubUserId: row.followerGithubUserId,
        login: row.login,
        avatarUrl: row.avatarUrl,
        kind: "lost",
        occurredAt: now.toISOString(),
      });
    }
  }

  await db
    .insert(followerWatchState)
    .values({
      ownerGithubUserId,
      lastSyncedAt: now,
      baselineCompletedAt: isBaseline ? now : (watch?.baselineCompletedAt ?? now),
    })
    .onConflictDoUpdate({
      target: followerWatchState.ownerGithubUserId,
      set: {
        lastSyncedAt: now,
        baselineCompletedAt: isBaseline ? now : watch?.baselineCompletedAt,
      },
    });

  return { isBaseline, watchedCount: currentFollowers.length, gained, lost };
}
