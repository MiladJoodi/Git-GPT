"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { OwnedRepoSummary } from "@/types/branches";
import { API_ERROR_KEYS } from "@/lib/i18n/core";
import { EmptyState } from "@/components/feedback/empty-state";
import { SearchField } from "@/components/users/search-field";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";

export function BranchReposView() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [repos, setRepos] = useState<OwnedRepoSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/branches/repos", {
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as {
          repositories?: OwnedRepoSummary[];
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
        setRepos(Array.isArray(body.repositories) ? body.repositories : []);
      } catch {
        setError("network");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = (repos ?? []).filter((repo) =>
    repo.fullName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("branchesTitle")}
        description={t("branchesHint")}
        backHref="/profile"
      />

      <div className="mb-3 shrink-0">
        <SearchField value={query} onChange={setQuery} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {error ? (
          <EmptyState title={t(API_ERROR_KEYS[error] ?? "errorFailed")} description="" />
        ) : null}

        {pending && !repos ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
          </div>
        ) : null}

        {repos && visible.length === 0 && !error ? (
          <EmptyState title={t("cleanupEmpty")} description="" />
        ) : null}

        {visible.length > 0 ? (
          <ul className="divide-y divide-border border-y">
            {visible.map((repo) => (
              <li key={repo.fullName}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-3 text-left text-sm hover:opacity-70"
                  onClick={() =>
                    router.push(
                      `/branches/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`,
                    )
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{repo.fullName}</span>
                  {repo.archived ? (
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {t("cleanupFilterArchived")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
