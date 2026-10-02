import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/responses";
import { requireAuthenticatedSession } from "@/lib/auth/require-session";
import {
  getFollowerEventTotals,
  getFollowerEvents,
  getWatchState,
} from "@/lib/db/follower-history";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  const ownerId = auth.session.githubUserId;
  const [events, totals, watch] = await Promise.all([
    getFollowerEvents(ownerId),
    getFollowerEventTotals(ownerId),
    getWatchState(ownerId),
  ]);

  return NextResponse.json({
    events,
    totals,
    lastSyncedAt: watch?.lastSyncedAt?.toISOString() ?? null,
    baselineCompletedAt: watch?.baselineCompletedAt?.toISOString() ?? null,
  });
}
