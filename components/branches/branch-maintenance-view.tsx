"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { BranchInfo } from "@/types/branches";
import type { BulkUnfollowProgress, BulkUnfollowResult } from "@/types/github";
import { emptyBulkProgress } from "@/types/github";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { formatCount } from "@/lib/format";
import { deleteBranchOnce, runBranchDeleteMany } from "@/components/app/use-branch-maintenance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/feedback/empty-state";
import { FilterPills } from "@/components/users/filter-pills";
import { PageHeader } from "@/components/navigation/page-header";
import { BulkProgressDialog } from "@/components/dialogs/bulk-progress";
import { BranchDeleteConfirmDialog } from "@/components/dialogs/branch-delete-confirm";
import { useI18n } from "@/components/i18n/i18n-provider";

type BranchesResponse = {
  defaultBranch: string;
  branches: BranchInfo[];
  error?: string;
};

type ViewFilter = "all" | "merged" | "unmerged";

function isMerged(branch: BranchInfo): boolean {
  return branch.status === "identical" || branch.status === "behind";
}

export function BranchMaintenanceView() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ owner: string; repo: string }>();
  const owner = decodeURIComponent(params.owner);
  const repo = decodeURIComponent(params.repo);
  const fullName = `${owner}/${repo}`;

  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<BranchesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewFilter>("merged");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState<BulkUnfollowProgress>(emptyBulkProgress());
  const [result, setResult] = useState<BulkUnfollowResult | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const [runId, setRunId] = useState(0);

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/branches/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
          { headers: { Accept: "application/json" } },
        );
        const body = (await response.json()) as BranchesResponse;
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
  }, [owner, repo]);

  const all = (data?.branches ?? []).filter((branch) => !branch.isDefault);
  const mergedCount = all.filter((branch) => isMerged(branch)).length;
  const unmergedCount = all.length - mergedCount;
  const visible = all.filter((branch) => {
    if (view === "merged") return isMerged(branch);
    if (view === "unmerged") return !isMerged(branch);
    return true;
  });
  const selectableIds = visible.filter((b) => !b.isProtected).map((b) => b.name);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(name: string, value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(name);
      else next.delete(name);
      return next;
    });
  }

  async function deleteOne(name: string) {
    if (progressOpen || rowPending) return;
    setRowPending(name);
    try {
      await deleteBranchOnce(owner, repo, name);
      setData((current) =>
        current
          ? { ...current, branches: current.branches.filter((b) => b.name !== name) }
          : current,
      );
      setSelected((current) => {
        const next = new Set(current);
        next.delete(name);
        return next;
      });
      toast.success(t("toastBranchDeleted", { branch: name }));
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "failed";
      if (code === "unauthorized") {
        router.replace("/login?error=session_expired");
        return;
      }
      toast.error(t(API_ERROR_KEYS[code] ?? "errorFailed"));
    } finally {
      setRowPending(null);
    }
  }

  async function runQueue(names: string[]) {
    if (names.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    setRunId(nextRunId);

    setProgress(emptyBulkProgress(names.length));
    setResult(null);
    setCancelling(false);
    setProgressOpen(true);

    const bulk = await runBranchDeleteMany(
      owner,
      repo,
      names,
      (next) => {
        if (runIdRef.current === nextRunId) setProgress(next);
      },
      controller.signal,
    );

    if (nextRunId !== runIdRef.current) return;

    if (bulk.succeeded.length > 0) {
      const done = new Set(bulk.succeeded);
      setData((current) =>
        current
          ? { ...current, branches: current.branches.filter((b) => !done.has(b.name)) }
          : current,
      );
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
      <PageHeader
        title={fullName}
        description={
          data ? t("branchesDefaultLabel", { branch: data.defaultBranch }) : ""
        }
        backHref="/branches"
      />

      <div className="mb-3 shrink-0">
        <FilterPills
          value={view}
          onChange={setView}
          options={[
            { value: "all", label: `${t("cleanupFilterAll")} (${formatCount(all.length)})` },
            {
              value: "merged",
              label: `${t("branchesMerged")} (${formatCount(mergedCount)})`,
            },
            {
              value: "unmerged",
              label: `${t("branchesUnmerged")} (${formatCount(unmergedCount)})`,
            },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {error ? (
          <EmptyState title={t(API_ERROR_KEYS[error] ?? "errorFailed")} description="" />
        ) : null}

        {pending && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
          </div>
        ) : null}

        {data && visible.length === 0 && !error ? (
          <EmptyState title={t("cleanupNothingMatches")} description="" />
        ) : null}

        {visible.length > 0 ? (
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
              {visible.map((branch) => (
                <li key={branch.name} className="flex items-start gap-3 py-3">
                  <Checkbox
                    className="mt-1"
                    checked={selected.has(branch.name)}
                    disabled={progressOpen || branch.isProtected}
                    onCheckedChange={(v) => toggle(branch.name, Boolean(v))}
                    aria-label={`${t("selectAll")} ${branch.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {branch.name}
                      {branch.isProtected ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t("branchesProtected")}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {branch.status === null
                        ? t("branchesStatusUnknown")
                        : isMerged(branch)
                          ? t("branchesStatusMerged")
                          : t("branchesStatusUnmerged", {
                              ahead: branch.aheadBy ?? 0,
                              behind: branch.behindBy ?? 0,
                            })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="rounded-sm"
                    disabled={progressOpen || rowPending === branch.name || branch.isProtected}
                    onClick={() => void deleteOne(branch.name)}
                  >
                    {rowPending === branch.name ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : null}
                    {t("cleanupDelete")}
                  </Button>
                </li>
              ))}
            </ul>
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
              <p className="text-sm font-medium">{t("selected", { count: selected.size })}</p>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                {t("clearSelection")}
              </button>
            </div>
            <Button variant="destructive" className="rounded-sm" onClick={() => setConfirmOpen(true)}>
              {t("cleanupDeleteSelected")}
            </Button>
          </div>
        </div>
      ) : null}

      <BranchDeleteConfirmDialog
        open={confirmOpen}
        count={selected.size}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          void runQueue([...selected]);
        }}
      />

      <BulkProgressDialog
        open={progressOpen}
        runId={runId}
        progress={progress}
        result={result}
        cancelling={cancelling}
        concurrency={1}
        action="delete"
        onStop={stopQueue}
        onClose={() => {
          setProgressOpen(false);
          setCancelling(false);
        }}
        onRetry={() => void runQueue(retryTargets.length ? retryTargets : [])}
      />
    </div>
  );
}
