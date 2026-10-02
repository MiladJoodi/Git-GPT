import { describe, expect, it } from "vitest";
import {
  activityGaps,
  currentStreak,
  longestStreak,
  monthlyTotals,
  weekdayTotals,
} from "@/lib/contributions/analyze";
import type { ContributionDayEntry } from "@/lib/contributions/analyze";

function days(spec: Record<string, number>): ContributionDayEntry[] {
  return Object.entries(spec).map(([date, count]) => ({
    date,
    count,
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
  }));
}

describe("longestStreak", () => {
  it("finds the longest run of active days", () => {
    const data = days({
      "2026-09-01": 1,
      "2026-09-02": 2,
      "2026-09-03": 0,
      "2026-09-04": 1,
      "2026-09-05": 1,
      "2026-09-06": 1,
      "2026-09-07": 0,
    });
    expect(longestStreak(data)).toEqual({
      length: 3,
      startDate: "2026-09-04",
      endDate: "2026-09-06",
    });
  });

  it("returns a zero streak when nothing is active", () => {
    const data = days({ "2026-09-01": 0, "2026-09-02": 0 });
    expect(longestStreak(data)).toEqual({
      length: 0,
      startDate: null,
      endDate: null,
    });
  });
});

describe("currentStreak", () => {
  it("counts backwards from today until the first empty day", () => {
    const data = days({
      "2026-09-01": 1,
      "2026-09-02": 0,
      "2026-09-03": 1,
      "2026-09-04": 1,
      "2026-09-05": 1,
    });
    expect(currentStreak(data, "2026-09-05")).toEqual({
      length: 3,
      startDate: "2026-09-03",
      endDate: "2026-09-05",
    });
  });

  it("is zero when today has no activity", () => {
    const data = days({ "2026-09-04": 1, "2026-09-05": 0 });
    expect(currentStreak(data, "2026-09-05").length).toBe(0);
  });
});

describe("weekdayTotals", () => {
  it("sums and averages contributions per weekday", () => {
    const data = [
      { date: "2026-09-06", count: 4, weekday: 0 },
      { date: "2026-09-13", count: 2, weekday: 0 },
      { date: "2026-09-07", count: 0, weekday: 1 },
    ];
    const totals = weekdayTotals(data);
    expect(totals[0]).toEqual({
      weekday: 0,
      total: 6,
      activeDays: 2,
      average: 3,
    });
    expect(totals[1]).toEqual({
      weekday: 1,
      total: 0,
      activeDays: 0,
      average: 0,
    });
  });
});

describe("monthlyTotals", () => {
  it("groups by calendar month in order", () => {
    const data = days({
      "2026-08-30": 2,
      "2026-08-31": 1,
      "2026-09-01": 3,
    });
    expect(monthlyTotals(data)).toEqual([
      { month: "2026-08", total: 3 },
      { month: "2026-09", total: 3 },
    ]);
  });
});

describe("activityGaps", () => {
  it("finds runs of inactivity at or above the minimum length", () => {
    const data = days({
      "2026-09-01": 1,
      "2026-09-02": 0,
      "2026-09-03": 0,
      "2026-09-04": 1,
      "2026-09-05": 0,
      "2026-09-06": 0,
      "2026-09-07": 0,
      "2026-09-08": 0,
      "2026-09-09": 1,
    });
    expect(activityGaps(data, 3)).toEqual([
      { startDate: "2026-09-05", endDate: "2026-09-08", length: 4 },
    ]);
  });

  it("sorts gaps most recent first", () => {
    const data = days({
      "2026-09-01": 0,
      "2026-09-02": 0,
      "2026-09-03": 0,
      "2026-09-04": 1,
      "2026-09-05": 1,
      "2026-09-06": 0,
      "2026-09-07": 0,
      "2026-09-08": 0,
      "2026-09-09": 1,
    });
    const gaps = activityGaps(data, 3);
    expect(gaps.map((g) => g.startDate)).toEqual([
      "2026-09-06",
      "2026-09-01",
    ]);
  });
});
