"use client";

import { useMemo, useState } from "react";
import { useGithubData } from "@/components/app/github-data-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { FollowersSkeleton } from "@/components/feedback/skeletons";
import { FilterPills } from "@/components/users/filter-pills";
import { ManageableUserList } from "@/components/users/manageable-user-list";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { RelatedUser } from "@/types/github";

type FollowersFilter = "all" | "mutual" | "follows_you";

export function FollowersView() {
  const { t } = useI18n();
  const { data, loading, error, refresh } = useGithubData();
  const [filter, setFilter] = useState<FollowersFilter>("all");

  const users = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterByStatus(data.followers, filter);
  }, [data, filter]);

  if (loading && !data) {
    return <FollowersSkeleton />;
  }

  if (error && !data) {
    return <ErrorState code={error} onRetry={() => void refresh()} />;
  }

  const empty =
    filter === "mutual"
      ? {
          title: t("followersMutualEmptyTitle"),
          body: t("followersMutualEmptyBody"),
        }
      : filter === "follows_you"
        ? {
            title: t("followersOnlyEmptyTitle"),
            body: t("followersOnlyEmptyBody"),
          }
        : {
            title: t("followersEmptyTitle"),
            body: t("followersEmptyBody"),
          };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("followersTitle")}
        description={t("followersHint")}
      />

      <div className="mb-4 shrink-0">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "mutual", label: t("filterMutual") },
            { value: "follows_you", label: t("filterYouDontFollow") },
          ]}
        />
      </div>

      <ManageableUserList
        users={users}
        emptyTitle={empty.title}
        emptyDescription={empty.body}
        selectable={false}
        showFollowAction
      />
    </div>
  );
}

function filterByStatus(users: RelatedUser[], filter: FollowersFilter) {
  if (filter === "all") {
    return users;
  }
  return users.filter((user) => user.status === filter);
}
