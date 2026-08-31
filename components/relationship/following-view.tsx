"use client";

import { useMemo, useState } from "react";
import { useGithubData } from "@/components/app/github-data-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { FollowingSkeleton } from "@/components/feedback/skeletons";
import { FilterPills } from "@/components/users/filter-pills";
import { ManageableUserList } from "@/components/users/manageable-user-list";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { RelatedUser } from "@/types/github";

type FollowingFilter = "all" | "mutual" | "not_following_back";

export function FollowingView() {
  const { t } = useI18n();
  const { data, loading, error, refresh } = useGithubData();
  const [filter, setFilter] = useState<FollowingFilter>("all");

  const users = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterByStatus(data.following, filter);
  }, [data, filter]);

  if (loading && !data) {
    return <FollowingSkeleton />;
  }

  if (error && !data) {
    return <ErrorState code={error} onRetry={() => void refresh()} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("followingTitle")}
        description={t("followingHint")}
      />

      <div className="mb-4 shrink-0">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "mutual", label: t("filterMutual") },
            { value: "not_following_back", label: t("filterNotBack") },
          ]}
        />
      </div>

      <ManageableUserList
        users={users}
        emptyTitle={t("followingEmptyTitle")}
        emptyDescription={t("followingEmptyBody")}
        showUnfollowAll
        unfollowAllCopy={
          filter === "not_following_back" ? "nonFollowers" : "everyone"
        }
      />
    </div>
  );
}

function filterByStatus(users: RelatedUser[], filter: FollowingFilter) {
  if (filter === "all") {
    return users;
  }
  return users.filter((user) => user.status === filter);
}
