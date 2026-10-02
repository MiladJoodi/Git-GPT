"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { ActivityGap, ContributionDayEntry, MonthTotal, StreakInfo, WeekdayTotal } from "@/lib/contributions/analyze";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { formatCount } from "@/lib/format";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";

type ContributionsResponse = {
  totalContributions: number;
  days: ContributionDayEntry[];
  longestStreak: StreakInfo;
  currentStreak: StreakInfo;
  weekdayTotals: WeekdayTotal[];
  monthlyTotals: MonthTotal[];
  gaps: ActivityGap[];
  error?: string;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function bucket(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

const BUCKET_CLASSES = [
  "bg-muted",
  "bg-emerald-300",
  "bg-emerald-500",
  "bg-emerald-600",
  "bg-emerald-800",
];

function buildWeeks(days: ContributionDayEntry[]): ContributionDayEntry[][] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const weeks: ContributionDayEntry[][] = [];
  let current: ContributionDayEntry[] = [];
  for (const day of sorted) {
    if (day.weekday === 0 && current.length > 0) {
      weeks.push(current);
      current = [];
    }
    current.push(day);
  }
  if (current.length > 0) weeks.push(current);
  return weeks;
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function ContributionInspectorView() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<ContributionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/contributions", {
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as ContributionsResponse;
        if (response.status === 401) {
          router.replace("/login?error=session_expired");
          return;
        }
        if (!response.ok) {
          setError(body.error ?? "failed");
          return;
        }
        setData(body);
      } catch {
        setError("network");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pending && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title={t("contributionsTitle")}
          description={t("contributionsHint")}
          backHref="/profile"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title={t("contributionsTitle")}
          description={t("contributionsHint")}
          backHref="/profile"
        />
        <EmptyState title={t(API_ERROR_KEYS[error] ?? "errorFailed")} description="" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const weeks = buildWeeks(data.days);
  const maxWeekdayTotal = Math.max(1, ...data.weekdayTotals.map((w) => w.total));
  const maxMonthTotal = Math.max(1, ...data.monthlyTotals.map((m) => m.total));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("contributionsTitle")}
        description={t("contributionsHint")}
        backHref="/profile"
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <p className="mb-4 text-sm font-medium">
          {t("contributionsTotal", { count: formatCount(data.totalContributions) })}
        </p>

        <div className="mb-6 overflow-x-auto">
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 10px)`,
              gridTemplateRows: "repeat(7, 10px)",
              gridAutoFlow: "column",
            }}
          >
            {weeks.map((week, weekIndex) =>
              week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className={`size-[10px] rounded-[2px] ${BUCKET_CLASSES[bucket(day.count)]}`}
                  style={{
                    gridColumn: weekIndex + 1,
                    gridRow: day.weekday + 1,
                  }}
                />
              )),
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("contributionsLongestStreak")}</p>
            <p className="text-lg font-medium">
              {data.longestStreak.length > 0
                ? formatCount(data.longestStreak.length)
                : "0"}
            </p>
            {data.longestStreak.startDate && data.longestStreak.endDate ? (
              <p className="text-xs text-muted-foreground">
                {t("contributionsStreakRange", {
                  start: formatShortDate(data.longestStreak.startDate),
                  end: formatShortDate(data.longestStreak.endDate),
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("contributionsNoStreak")}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("contributionsCurrentStreak")}</p>
            <p className="text-lg font-medium">
              {data.currentStreak.length > 0
                ? formatCount(data.currentStreak.length)
                : "0"}
            </p>
            {data.currentStreak.startDate && data.currentStreak.endDate ? (
              <p className="text-xs text-muted-foreground">
                {t("contributionsStreakRange", {
                  start: formatShortDate(data.currentStreak.startDate),
                  end: formatShortDate(data.currentStreak.endDate),
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("contributionsNoStreak")}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">{t("contributionsWeekdayTitle")}</p>
          <div className="space-y-1.5">
            {data.weekdayTotals.map((entry) => (
              <div key={entry.weekday} className="flex items-center gap-2">
                <span className="w-4 text-xs text-muted-foreground">
                  {WEEKDAY_LABELS[entry.weekday]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(entry.total / maxWeekdayTotal) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {formatCount(entry.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">{t("contributionsMonthlyTitle")}</p>
          <div className="space-y-1.5">
            {data.monthlyTotals.map((entry) => (
              <div key={entry.month} className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">{entry.month}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(entry.total / maxMonthTotal) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {formatCount(entry.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">{t("contributionsGapsTitle")}</p>
          <p className="mb-2 text-xs text-muted-foreground">{t("contributionsGapsHint")}</p>
          {data.gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("contributionsNoGaps")}</p>
          ) : (
            <ul className="divide-y divide-border border-y">
              {data.gaps.map((gap) => (
                <li
                  key={gap.startDate}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>
                    {t("contributionsGapRange", {
                      start: formatShortDate(gap.startDate),
                      end: formatShortDate(gap.endDate),
                      days: gap.length,
                      dayWord: gap.length === 1 ? t("dayOne") : t("dayMany"),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
