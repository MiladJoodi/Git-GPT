"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import type { BulkUnfollowProgress, BulkUnfollowResult } from "@/types/github";
import { emptyBulkProgress } from "@/types/github";
import type { ForkCheck, ForkRepo } from "@/types/cleanup";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { formatCount } from "@/lib/format";
import {
  FORK_VIEWS,
  filterForks,
  forkStatus,
  forkViewCounts,
  type ForkView,
} from "@/lib/cleanup/filters";
import {
  archiveForkOnce,
  checkForkOnce,
  deleteForkOnce,
  syncForkOnce,
  runForkActionMany,
  unarchiveForkOnce,
} from "@/components/app/use-fork-cleanup";
import { StalenessGauge } from "@/components/app/staleness-gauge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/feedback/empty-state";
import { FilterPills } from "@/components/users/filter-pills";
import { SearchField } from "@/components/users/search-field";
import { BulkProgressDialog } from "@/components/dialogs/bulk-progress";
import { CleanupConfirmDialog } from "@/components/dialogs/cleanup-confirm";
import { useI18n } from "@/components/i18n/i18n-provider";

type BulkKind = "archive" | "unarchive" | "delete";

type PendingConfirm = {
  kind: BulkKind;
  targets: string[];
};

export function ForksCleanupView() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forks, setForks] = useState<ForkRepo[] | null>(null);
  const [checks, setChecks] = useState<Record<string, ForkCheck>>({});
  const [checkingAll, setCheckingAll] = useState(false);
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ForkView>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressAction, setProgressAction] = useState<BulkKind>("archive");
  const [progress, setProgress] = useState<BulkUnfollowProgress>(
    emptyBulkProgress(),
  );
  const [result, setResult] = useState<BulkUnfollowResult | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const [runId, setRunId] = useState(0);

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/cleanup/forks", {
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as {
          forks?: ForkRepo[];
          checks?: Record<string, ForkCheck>;
          error?: string;
        };
        if (response.status === 401) {
          router.replace("/login?error=session_expired");
          return;
        }
        if (!response.ok) {
          setError(body.error ?? "failed");
          return;
        }
        setForks(Array.isArray(body.forks) ? body.forks : []);
        setChecks(body.checks ?? {});
      } catch {
        setError("network");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  function handleAuthError(code: string): boolean {
    if (code === "unauthorized") {
      router.replace("/login?error=session_expired");
      return true;
    }
    return false;
  }

  function errCode(err: unknown): string {
    return err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "failed";
  }

  const all = forks ?? [];
  const visible = filterForks(all, view, query, checks);
  const counts = forkViewCounts(all, checks);
  const selectableIds = visible.map((f) => f.fullName);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const uncheckedCount = all.filter((f) => !checks[f.fullName]).length;
  const selectedForks = [...selected]
    .map((name) => all.find((f) => f.fullName === name))
    .filter((f): f is ForkRepo => f !== undefined);
  const archivableSelected = selectedForks
    .filter((f) => !f.archived)
    .map((f) => f.fullName);
  const unarchivableSelected = selectedForks
    .filter((f) => f.archived)
    .map((f) => f.fullName);

  function toggle(fullName: string, value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(fullName);
      else next.delete(fullName);
      return next;
    });
  }

  async function checkOne(fullName: string) {
    setRowPending(fullName);
    try {
      const check = await checkForkOnce(fullName);
      setChecks((current) => ({ ...current, [fullName]: check }));
    } catch (err) {
      const code = errCode(err);
      if (!handleAuthError(code)) {
        toast.error(t(API_ERROR_KEYS[code] ?? "errorFailed"));
      }
    } finally {
      setRowPending(null);
    }
  }

  async function checkAllUnchecked() {
    const targets = all.filter((f) => !checks[f.fullName]).map((f) => f.fullName);
    if (targets.length === 0 || checkingAll) return;
    setCheckingAll(true);
    for (const fullName of targets) {
      try {
        const check = await checkForkOnce(fullName);
        setChecks((current) => ({ ...current, [fullName]: check }));
      } catch (err) {
        if (handleAuthError(errCode(err))) {
          setCheckingAll(false);
          return;
        }
        // Keep going — one repo failing to compare shouldn't stop the rest.
      }
    }
    setCheckingAll(false);
  }

  async function syncOne(fullName: string) {
    if (progressOpen || rowPending) return;
    setRowPending(fullName);
    try {
      const mergeType = await syncForkOnce(fullName);
      toast.success(
        mergeType === "none"
          ? t("toastCleanupUpToDate", { fullName })
          : t("toastCleanupSynced", { fullName }),
      );
    } catch (err) {
      const code = errCode(err);
      if (!handleAuthError(code)) {
        toast.error(t(API_ERROR_KEYS[code] ?? "errorFailed"));
      }
    } finally {
      setRowPending(null);
    }
  }

  async function actOne(fullName: string, kind: BulkKind) {
    const target = (forks ?? []).find((f) => f.fullName === fullName);
    if (kind === "archive" && target?.archived) return;
    if (kind === "unarchive" && !target?.archived) return;

    setRowPending(fullName);
    try {
      if (kind === "archive") {
        await archiveForkOnce(fullName);
        setForks((current) =>
          (current ?? []).map((f) =>
            f.fullName === fullName ? { ...f, archived: true } : f,
          ),
        );
        toast.success(t("toastCleanupArchived", { fullName }));
      } else if (kind === "unarchive") {
        await unarchiveForkOnce(fullName);
        setForks((current) =>
          (current ?? []).map((f) =>
            f.fullName === fullName ? { ...f, archived: false } : f,
          ),
        );
        toast.success(t("toastCleanupUnarchived", { fullName }));
      } else {
        await deleteForkOnce(fullName);
        setForks((current) =>
          (current ?? []).filter((f) => f.fullName !== fullName),
        );
        toast.success(t("toastCleanupDeleted", { fullName }));
      }
      setSelected((current) => {
        const next = new Set(current);
        next.delete(fullName);
        return next;
      });
    } catch (err) {
      const code = errCode(err);
      if (!handleAuthError(code)) {
        toast.error(t(API_ERROR_KEYS[code] ?? "errorFailed"));
      }
    } finally {
      setRowPending(null);
    }
  }

  async function runQueue(fullNames: string[], kind: BulkKind) {
    const targets = fullNames.filter((name) => {
      const fork = (forks ?? []).find((f) => f.fullName === name);
      if (!fork) return false;
      if (kind === "archive") return !fork.archived;
      if (kind === "unarchive") return fork.archived;
      return true;
    });
    if (targets.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    setRunId(nextRunId);

    setProgressAction(kind);
    setProgress(emptyBulkProgress(targets.length));
    setResult(null);
    setCancelling(false);
    setProgressOpen(true);

    const bulk = await runForkActionMany(
      targets,
      kind,
      (next) => {
        if (runIdRef.current === nextRunId) setProgress(next);
      },
      controller.signal,
    );

    if (nextRunId !== runIdRef.current) return;

    if (bulk.succeeded.length > 0) {
      const done = new Set(bulk.succeeded);
      if (kind === "archive") {
        setForks((current) =>
          (current ?? []).map((f) =>
            done.has(f.fullName) ? { ...f, archived: true } : f,
          ),
        );
      } else if (kind === "unarchive") {
        setForks((current) =>
          (current ?? []).map((f) =>
            done.has(f.fullName) ? { ...f, archived: false } : f,
          ),
        );
      } else {
        setForks((current) =>
          (current ?? []).filter((f) => !done.has(f.fullName)),
        );
      }
    }

    if (abortRef.current === controller) abortRef.current = null;
    setResult(bulk);
    setCancelling(false);
    setSelected(new Set());

    if (bulk.abortReason === "unauthorized") {
      router.replace("/login?error=session_expired");
    }
  }

  function stopQueue() {
    setCancelling(true);
    abortRef.current?.abort();
  }

  const retryTargets = result
    ? [...result.failed.map((f) => f.username), ...result.aborted]
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 pb-3">
        <SearchField value={query} onChange={setQuery} />
        <FilterPills
          value={view}
          onChange={setView}
          options={FORK_VIEWS.map((v) => ({
            value: v.id,
            label: `${t(v.labelKey)} (${formatCount(counts[v.id])})`,
          }))}
        />
        {uncheckedCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-sm"
            disabled={checkingAll}
            onClick={() => void checkAllUnchecked()}
          >
            {checkingAll ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" aria-hidden="true" />
            )}
            {t("cleanupCheckAll")} ({formatCount(uncheckedCount)})
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {error ? (
          <EmptyState
            title={t(API_ERROR_KEYS[error] ?? "errorFailed")}
            description={t("cleanupEmpty")}
          />
        ) : null}

        {pending && !forks ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            {t("cleanupLoading")}
          </div>
        ) : null}

        {forks && forks.length === 0 && !error ? (
          <EmptyState title={t("cleanupEmpty")} description="" />
        ) : null}

        {forks && forks.length > 0 ? (
          <>
            {visible.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                {t("cleanupNothingMatches")}
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 text-sm">
                  <button
                    type="button"
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setSelected(allSelected ? new Set() : new Set(selectableIds))
                    }
                  >
                    {allSelected ? t("clearSelection") : t("selectAll")}
                  </button>
                </div>
                <ul className="divide-y divide-border border-y">
                  {visible.map((fork) => {
                    const check = checks[fork.fullName];
                    const status = forkStatus(check);
                    const now = Date.now();
                    return (
                      <li key={fork.fullName} className="flex items-start gap-3 py-3">
                        <Checkbox
                          className="mt-1"
                          checked={selected.has(fork.fullName)}
                          disabled={progressOpen}
                          onCheckedChange={(v) => toggle(fork.fullName, Boolean(v))}
                          aria-label={`${t("selectAll")} ${fork.fullName}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {fork.fullName}
                            {fork.archived ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({t("cleanupFilterArchived")})
                              </span>
                            ) : null}
                          </p>
                          {check?.parent ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {t("cleanupParent", { parent: check.parent })}
                            </p>
                          ) : null}
                          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <StalenessGauge pushedAt={fork.pushedAt} now={now} />
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {status === "unchecked" && t("cleanupStatusUnchecked")}
                            {status === "unknown" && t("cleanupStatusUnknown")}
                            {status === "clean" && t("cleanupStatusClean")}
                            {status === "unique" &&
                              t("cleanupStatusUnique", {
                                count: check?.aheadBy ?? 0,
                                commits:
                                  check?.aheadBy === 1
                                    ? t("commitOne")
                                    : t("commitMany"),
                              })}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-sm"
                            disabled={progressOpen || rowPending === fork.fullName}
                            onClick={() => void checkOne(fork.fullName)}
                          >
                            {rowPending === fork.fullName ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : null}
                            {t("cleanupCheck")}
                          </Button>
                          {status === "clean" && !fork.archived ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-sm"
                              disabled={
                                progressOpen || rowPending === fork.fullName
                              }
                              onClick={() => void syncOne(fork.fullName)}
                            >
                              {t("cleanupSync")}
                            </Button>
                          ) : null}
                          {fork.archived ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-sm"
                              disabled={
                                progressOpen || rowPending === fork.fullName
                              }
                              onClick={() =>
                                void actOne(fork.fullName, "unarchive")
                              }
                            >
                              {t("cleanupUnarchive")}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-sm"
                              disabled={
                                progressOpen || rowPending === fork.fullName
                              }
                              onClick={() =>
                                void actOne(fork.fullName, "archive")
                              }
                            >
                              {t("cleanupArchive")}
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="rounded-sm"
                            disabled={progressOpen || rowPending === fork.fullName}
                            onClick={() =>
                              setConfirm({
                                kind: "delete",
                                targets: [fork.fullName],
                              })
                            }
                          >
                            {t("cleanupDelete")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-sm"
                            onClick={() =>
                              window.open(
                                fork.htmlUrl,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <div
          role="region"
          aria-label={t("selected", { count: selected.size })}
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-5"
          style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 border border-border bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {t("selected", { count: selected.size })}
              </p>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                {t("clearSelection")}
              </button>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {archivableSelected.length > 0 ? (
                <Button
                  variant="outline"
                  className="rounded-sm"
                  onClick={() =>
                    setConfirm({ kind: "archive", targets: archivableSelected })
                  }
                >
                  {t("cleanupArchiveSelected")}
                  {archivableSelected.length < selected.size
                    ? ` (${formatCount(archivableSelected.length)})`
                    : ""}
                </Button>
              ) : null}
              {unarchivableSelected.length > 0 ? (
                <Button
                  variant="outline"
                  className="rounded-sm"
                  onClick={() =>
                    setConfirm({
                      kind: "unarchive",
                      targets: unarchivableSelected,
                    })
                  }
                >
                  {t("cleanupUnarchiveSelected")}
                  {unarchivableSelected.length < selected.size
                    ? ` (${formatCount(unarchivableSelected.length)})`
                    : ""}
                </Button>
              ) : null}
              <Button
                variant="destructive"
                className="rounded-sm"
                onClick={() =>
                  setConfirm({ kind: "delete", targets: [...selected] })
                }
              >
                {t("cleanupDeleteSelected")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <CleanupConfirmDialog
        open={confirm !== null}
        kind={confirm?.kind ?? "archive"}
        count={confirm?.targets.length ?? 0}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          const next = confirm;
          setConfirm(null);
          if (!next || next.targets.length === 0) return;
          if (next.targets.length === 1) {
            void actOne(next.targets[0], next.kind);
            return;
          }
          void runQueue(next.targets, next.kind);
        }}
      />

      <BulkProgressDialog
        open={progressOpen}
        runId={runId}
        progress={progress}
        result={result}
        cancelling={cancelling}
        concurrency={1}
        action={progressAction}
        onStop={stopQueue}
        onClose={() => {
          setProgressOpen(false);
          setCancelling(false);
        }}
        onRetry={() =>
          void runQueue(retryTargets.length ? retryTargets : [], progressAction)
        }
      />
    </div>
  );
}
