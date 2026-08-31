"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, UserMinus } from "lucide-react";
import type {
  BulkUnfollowProgress,
  BulkUnfollowResult,
  RelatedUser,
} from "@/types/github";
import { emptyBulkProgress } from "@/types/github";
import { matchesSearch } from "@/lib/search";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGithubData } from "@/components/app/github-data-provider";
import { unfollowMany, useFollowActions } from "@/components/app/use-unfollow";
import { SearchField } from "@/components/users/search-field";
import { UserList } from "@/components/users/user-list";
import { SelectionBar } from "@/components/users/selection-bar";
import { EmptyState } from "@/components/feedback/empty-state";
import { UnfollowConfirmDialog } from "@/components/dialogs/unfollow-confirm";
import { BulkProgressDialog } from "@/components/dialogs/bulk-progress";
import { useI18n } from "@/components/i18n/i18n-provider";

type ManageableUserListProps = {
  users: RelatedUser[];
  emptyTitle: string;
  emptyDescription: string;
  selectable?: boolean;
  showUnfollowAll?: boolean;
  showFollowAction?: boolean;
  unfollowAllCopy?: "everyone" | "nonFollowers";
};

export function ManageableUserList({
  users,
  emptyTitle,
  emptyDescription,
  selectable = true,
  showUnfollowAll = false,
  showFollowAction = false,
  unfollowAllCopy = "everyone",
}: ManageableUserListProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { removeFollowing } = useGithubData();
  const { unfollowOne, followOne, pending } = useFollowActions();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargets, setConfirmTargets] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState<
    "selected" | "all" | "nonFollowers"
  >("selected");
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState<BulkUnfollowProgress>(
    emptyBulkProgress(),
  );
  const [result, setResult] = useState<BulkUnfollowResult | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const [runId, setRunId] = useState(0);

  const filtered = useMemo(
    () => users.filter((user) => matchesSearch(user, debouncedQuery)),
    [users, debouncedQuery],
  );

  function toggle(login: string, value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) {
        next.add(login);
      } else {
        next.delete(login);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(filtered.map((user) => user.login)));
  }

  async function runQueue(usernames: string[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    setRunId(nextRunId);

    setQueue(usernames);
    setProgress(emptyBulkProgress(usernames.length));
    setResult(null);
    setCancelling(false);
    setProgressOpen(true);

    const bulk = await unfollowMany(
      usernames,
      (next) => {
        if (runIdRef.current === nextRunId) {
          setProgress(next);
        }
      },
      controller.signal,
    );

    if (bulk.succeeded.length > 0) {
      removeFollowing(bulk.succeeded);
    }

    if (nextRunId !== runIdRef.current) {
      return;
    }

    if (abortRef.current === controller) {
      abortRef.current = null;
    }

    setResult(bulk);
    setCancelling(false);
    setSelected(new Set());

    if (bulk.abortReason === "unauthorized") {
      router.replace("/login?error=session_expired");
      return;
    }

    if (bulk.abortReason === "cancelled") {
      if (bulk.succeeded.length > 0) {
        toast.message(
          t("toastStopped", {
            ok: bulk.succeeded.length,
            skipped: bulk.aborted.length,
          }),
        );
      } else {
        toast.message(t("toastStoppedNone"));
      }
      return;
    }

    if (bulk.abortReason === "rate_limited") {
      toast.error(t(API_ERROR_KEYS.rate_limited));
    } else if (bulk.failed.length === 0 && bulk.aborted.length === 0) {
      toast.success(
        t("toastUnfollowedMany", {
          count: bulk.succeeded.length,
          accounts:
            bulk.succeeded.length === 1 ? t("accountOne") : t("accountMany"),
        }),
      );
    }
  }

  function stopQueue() {
    setCancelling(true);
    abortRef.current?.abort();
  }

  const retryTargets = result
    ? [...result.failed.map((item) => item.username), ...result.aborted]
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 pb-3">
        <SearchField value={query} onChange={setQuery} />
        {filtered.length > 0 && selectable ? (
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={
                selected.size === filtered.length
                  ? () => setSelected(new Set())
                  : selectAllVisible
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {selected.size === filtered.length ? (
                  <Square className="size-3.5" />
                ) : (
                  <CheckSquare className="size-3.5" />
                )}
                {selected.size === filtered.length
                  ? t("clearSelection")
                  : t("selectAll")}
              </span>
            </button>
            {showUnfollowAll ? (
              <button
                type="button"
                className="cursor-pointer font-medium text-destructive hover:underline"
                onClick={() => {
                  const targets = filtered.map((user) => user.login);
                  if (targets.length === 0) {
                    return;
                  }
                  setConfirmTargets(targets);
                  setConfirmMode(
                    unfollowAllCopy === "nonFollowers"
                      ? "nonFollowers"
                      : "all",
                  );
                  setConfirmOpen(true);
                }}
              >
              <span className="inline-flex items-center gap-1.5">
                <UserMinus className="size-3.5" />
                {t("unfollowAll")}
              </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="min-h-0 flex-1">
          <EmptyState
            title={query ? t("noPeopleTitle") : emptyTitle}
            description={query ? t("noPeopleBody") : emptyDescription}
          />
        </div>
      ) : (
        <UserList
          users={filtered}
          selectable={selectable}
          showFollowAction={showFollowAction}
          selected={selected}
          onToggle={toggle}
          onUnfollow={(login) => void unfollowOne(login)}
          onFollow={(user) => void followOne(user)}
          pendingUsername={pending}
        />
      )}

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onUnfollow={() => {
          const targets = Array.from(selected);
          if (targets.length === 0) {
            return;
          }
          setConfirmTargets(targets);
          setConfirmMode("selected");
          setConfirmOpen(true);
        }}
      />

      <UnfollowConfirmDialog
        open={confirmOpen}
        count={confirmTargets.length}
        mode={confirmMode}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void runQueue(confirmTargets)}
      />

      <BulkProgressDialog
        open={progressOpen}
        runId={runId}
        progress={progress}
        result={result}
        cancelling={cancelling}
        onStop={stopQueue}
        onClose={() => {
          setProgressOpen(false);
          setCancelling(false);
        }}
        onRetry={() => void runQueue(retryTargets.length ? retryTargets : queue)}
      />
    </div>
  );
}
