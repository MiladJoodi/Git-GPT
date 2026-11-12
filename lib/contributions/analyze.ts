export type ContributionDayEntry = {
  date: string;
  count: number;
  weekday: number;
};

export type StreakInfo = {
  length: number;
  startDate: string | null;
  endDate: string | null;
};

export type WeekdayTotal = {
  weekday: number;
  total: number;
  activeDays: number;
  average: number;
};

export type MonthTotal = {
  month: string;
  total: number;
};

export type ActivityGap = {
  startDate: string;
  endDate: string;
  length: number;
};

function sortedByDate(days: ContributionDayEntry[]): ContributionDayEntry[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

export function longestStreak(days: ContributionDayEntry[]): StreakInfo {
  const sorted = sortedByDate(days);
  let best: StreakInfo = { length: 0, startDate: null, endDate: null };
  let runStart: string | null = null;
  let runLength = 0;

  for (const day of sorted) {
    if (day.count > 0) {
      if (runLength === 0) runStart = day.date;
      runLength += 1;
      if (runLength > best.length) {
        best = { length: runLength, startDate: runStart, endDate: day.date };
      }
    } else {
      runLength = 0;
      runStart = null;
    }
  }

  return best;
}

export function currentStreak(
  days: ContributionDayEntry[],
  today: string,
): StreakInfo {
  const sorted = sortedByDate(days).filter((day) => day.date <= today);
  let length = 0;
  let endDate: string | null = null;
  let startDate: string | null = null;

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const day = sorted[i];
    if (day.count > 0) {
      if (length === 0) endDate = day.date;
      length += 1;
      startDate = day.date;
    } else {
      break;
    }
  }

  return { length, startDate, endDate };
}

export function weekdayTotals(days: ContributionDayEntry[]): WeekdayTotal[] {
  const totals = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    total: 0,
    activeDays: 0,
    average: 0,
  }));

  for (const day of days) {
    const bucket = totals[day.weekday];
    if (!bucket) continue;
    bucket.total += day.count;
    if (day.count > 0) bucket.activeDays += 1;
  }

  const dayCounts = Array.from({ length: 7 }, () => 0);
  for (const day of days) {
    dayCounts[day.weekday] = (dayCounts[day.weekday] ?? 0) + 1;
  }

  return totals.map((bucket, weekday) => ({
    ...bucket,
    average:
      dayCounts[weekday] > 0
        ? Math.round((bucket.total / dayCounts[weekday]) * 10) / 10
        : 0,
  }));
}

export function monthlyTotals(days: ContributionDayEntry[]): MonthTotal[] {
  const totals = new Map<string, number>();
  for (const day of sortedByDate(days)) {
    const month = day.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + day.count);
  }
  return [...totals.entries()].map(([month, total]) => ({ month, total }));
}

export function activityGaps(
  days: ContributionDayEntry[],
  minLength = 3,
): ActivityGap[] {
  const sorted = sortedByDate(days);
  const gaps: ActivityGap[] = [];
  let runStart: string | null = null;
  let runEnd: string | null = null;
  let runLength = 0;

  function flush() {
    if (runLength >= minLength && runStart && runEnd) {
      gaps.push({ startDate: runStart, endDate: runEnd, length: runLength });
    }
    runStart = null;
    runEnd = null;
    runLength = 0;
  }

  for (const day of sorted) {
    if (day.count === 0) {
      if (runLength === 0) runStart = day.date;
      runEnd = day.date;
      runLength += 1;
    } else {
      flush();
    }
  }
  flush();

  return gaps.sort((a, b) => b.endDate.localeCompare(a.endDate));
}
