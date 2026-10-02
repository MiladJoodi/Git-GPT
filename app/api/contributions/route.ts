import { NextResponse } from "next/server";
import { githubErrorResponse, jsonError } from "@/lib/api/responses";
import {
  requireAuthenticatedSession,
  withGitHubRetry,
} from "@/lib/auth/require-session";
import { fetchContributionCalendar } from "@/lib/github/contributions";
import {
  activityGaps,
  currentStreak,
  longestStreak,
  monthlyTotals,
  weekdayTotals,
} from "@/lib/contributions/analyze";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if (!auth) {
    return jsonError("unauthorized", 401);
  }

  try {
    const { value: calendar } = await withGitHubRetry(
      auth.session,
      auth.token,
      (token) => fetchContributionCalendar(token),
    );

    const today = new Date().toISOString().slice(0, 10);

    return NextResponse.json({
      totalContributions: calendar.totalContributions,
      days: calendar.days,
      longestStreak: longestStreak(calendar.days),
      currentStreak: currentStreak(calendar.days, today),
      weekdayTotals: weekdayTotals(calendar.days),
      monthlyTotals: monthlyTotals(calendar.days),
      gaps: activityGaps(calendar.days, 3).slice(0, 10),
    });
  } catch (error) {
    return githubErrorResponse(error);
  }
}
