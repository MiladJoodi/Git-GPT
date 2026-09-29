"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserMinus, UserPlus } from "lucide-react";
import type { FollowerHistoryEntry } from "@/types/follower-history";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { formatCount, relativeTimeValue } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";

type HistoryResponse = {
  events: FollowerHistoryEntry[];
  totals: { gained: number; lost: number };
  lastSyncedAt: string | null;
  baselineCompletedAt: string | null;
  error?: string;
};

function ageLabel(iso: string | null, now: number): string {
  if (!iso) return "";
  const value = relativeTimeValue(Date.parse(iso), now);
  return value.justNow ? "just now" : value.relative;
}

function dateGroupKey(iso: string): string {
  return iso.slice(0, 10);
}

export function FollowerHistoryView() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = Date.now();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/follower-history", {
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as HistoryResponse;
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

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const response = await fetch("/api/follower-history/sync", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as {
        isBaseline?: boolean;
        watchedCount?: number;
        gained?: FollowerHistoryEntry[];
        lost?: FollowerHistoryEntry[];
        error?: string;
      };
      if (response.status === 401) {
        router.replace("/login?error=session_expired");
        return;
      }
      if (!response.ok) {
        toast.error(t(API_ERROR_KEYS[body.error ?? "failed"] ?? "errorFailed"));
        return;
      }
      if (body.isBaseline) {
        toast.success(
          t("followerHistoryBaselineDone", {
            count: formatCount(body.watchedCount ?? 0),
            followers: t("followerMany"),
          }),
        );
      } else {
        const gained = body.gained?.length ?? 0;
        const lost = body.lost?.length ?? 0;
        if (gained === 0 && lost === 0) {
          toast.success(t("followerHistoryNoChange"));
        } else {
          toast.success(
            t("followerHistorySummary", { gained, lost }),
          );
        }
      }
      load();
    } catch {
      toast.error(t("errorNetwork"));
    } finally {
      setSyncing(false);
    }
  }

  if (error && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          title={t("followerHistoryTitle")}
          description={t("followerHistoryHint")}
          backHref="/profile"
        />
        <EmptyState
          title={t(API_ERROR_KEYS[error] ?? "errorFailed")}
          description=""
        />
      </div>
    );
  }

  const groups: { date: string; entries: FollowerHistoryEntry[] }[] = [];
  if (data) {
    const byDate = new Map<string, FollowerHistoryEntry[]>();
    for (const entry of data.events) {
      const key = dateGroupKey(entry.occurredAt);
      const list = byDate.get(key) ?? [];
      list.push(entry);
      byDate.set(key, list);
    }
    for (const [date, entries] of byDate) {
      groups.push({ date, entries });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("followerHistoryTitle")}
        description={t("followerHistoryHint")}
        backHref="/profile"
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-sm"
            disabled={syncing || pending}
            onClick={() => void sync()}
          >
            {syncing ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : null}
            {syncing ? t("followerHistorySyncing") : t("followerHistorySync")}
          </Button>
        }
      />

      {data ? (
        <p className="mb-4 shrink-0 text-xs text-muted-foreground">
          {data.lastSyncedAt
            ? t("followerHistoryLastSynced", { age: ageLabel(data.lastSyncedAt, now) })
            : t("followerHistoryNeverSynced")}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {pending && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
          </div>
        ) : null}

        {data && !data.baselineCompletedAt ? (
          <EmptyState
            title={t("followerHistoryBaselineTitle")}
            description={t("followerHistoryBaselineHint")}
          />
        ) : null}

        {data && data.baselineCompletedAt && groups.length === 0 ? (
          <EmptyState title={t("followerHistoryEmpty")} description="" />
        ) : null}

        {groups.map((group) => (
          <div key={group.date} className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {group.date}
            </p>
            <ul className="divide-y divide-border border-y">
              {group.entries.map((entry, index) => (
                <li
                  key={`${entry.githubUserId}-${entry.occurredAt}-${index}`}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={entry.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {entry.login.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`https://github.com/${entry.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium hover:underline"
                    >
                      @{entry.login}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {entry.kind === "gained"
                        ? t("followerHistoryGained")
                        : t("followerHistoryLost")}
                      {" · "}
                      {ageLabel(entry.occurredAt, now)}
                    </p>
                  </div>
                  {entry.kind === "gained" ? (
                    <UserPlus className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <UserMinus className="size-4 shrink-0 text-destructive" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {data && data.baselineCompletedAt && data.totals ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("followerHistoryTotals", {
              gained: formatCount(data.totals.gained),
              followers: t("followerMany"),
              lost: formatCount(data.totals.lost),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
