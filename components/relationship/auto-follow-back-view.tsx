"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { BulkUnfollowProgress, BulkUnfollowResult } from "@/types/github";
import { emptyBulkProgress } from "@/types/github";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { useGithubData } from "@/components/app/github-data-provider";
import { followManySequential } from "@/components/app/use-unfollow";
import { PageHeader } from "@/components/navigation/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { UserList } from "@/components/users/user-list";
import { FollowConfirmDialog } from "@/components/dialogs/follow-confirm";
import { BulkProgressDialog } from "@/components/dialogs/bulk-progress";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AutoFollowBackView() {
  const router = useRouter();
  const { t } = useI18n();
  const { data, loading, error, refresh, addFollowing } = useGithubData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState<BulkUnfollowProgress>(emptyBulkProgress());
  const [result, setResult] = useState<BulkUnfollowResult | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [runId, setRunId] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const targets = useMemo(
    () => (data ? data.followers.filter((user) => user.status === "follows_you") : []),
    [data],
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader title={t("autoFollowBack")} description={t("autoFollowBackHint")} backHref="/" />
        <div className="min-h-0 flex-1" aria-busy="true" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader title={t("autoFollowBack")} description={t("autoFollowBackHint")} backHref="/" />
        <div className="min-h-0 flex-1">
          <EmptyState title={t("errorFailed")} description={error} />
        </div>
      </div>
    );
  }

  async function run(logins: string[]) {
    const controller = new AbortController();
    abortRef.current = controller;
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    setRunId(nextRunId);
    setProgress(emptyBulkProgress(logins.length));
    setResult(null);
    setCancelling(false);
    setProgressOpen(true);

    const related = (data?.followers ?? []).filter((user) =>
      logins.includes(user.login),
    );

    const bulk = await followManySequential(
      logins,
      (next) => {
        if (runIdRef.current === nextRunId) setProgress(next);
      },
      controller.signal,
    );

    if (bulk.succeeded.length > 0) {
      addFollowing(related.filter((user) => bulk.succeeded.includes(user.login)));
    }
    if (nextRunId !== runIdRef.current) return;

    abortRef.current = null;
    setResult(bulk);
    setCancelling(false);

    if (bulk.abortReason === "unauthorized") {
      router.replace("/login?error=session_expired");
      return;
    }
    if (bulk.abortReason === "rate_limited") {
      toast.error(t(API_ERROR_KEYS.rate_limited));
    } else if (bulk.succeeded.length > 0) {
      toast.success(
        t("autoFollowBackDone", {
          count: bulk.succeeded.length,
          accounts: bulk.succeeded.length === 1 ? t("accountOne") : t("accountMany"),
        }),
      );
    }
    void refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title={t("autoFollowBack")} description={t("autoFollowBackHint")} backHref="/" />

      {targets.length === 0 ? (
        <div className="min-h-0 flex-1">
          <EmptyState title={t("autoFollowBackEmpty")} description={t("autoFollowBackHint")} />
        </div>
      ) : (
        <>
          <UserList users={targets} showFollowAction />
          <FollowConfirmDialog
            open={confirmOpen}
            count={targets.length}
            onOpenChange={setConfirmOpen}
            onConfirm={() => {
              setConfirmOpen(false);
              void run(targets.map((user) => user.login));
            }}
          />
          <BulkProgressDialog
            open={progressOpen}
            runId={runId}
            progress={progress}
            result={result}
            cancelling={cancelling}
            onStop={() => {
              setCancelling(true);
              abortRef.current?.abort();
            }}
            onClose={() => setProgressOpen(false)}
            onRetry={() => {
              setProgressOpen(false);
              void run(targets.map((user) => user.login));
            }}
          />
        </>
      )}
    </div>
  );
}
