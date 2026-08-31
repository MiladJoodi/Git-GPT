"use client";

import {
  notFollowingBack,
  useGithubData,
} from "@/components/app/github-data-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { NonFollowersSkeleton } from "@/components/feedback/skeletons";
import { ManageableUserList } from "@/components/users/manageable-user-list";
import { PageHeader } from "@/components/navigation/page-header";
import { useI18n } from "@/components/i18n/i18n-provider";

export function NonFollowersView() {
  const { t } = useI18n();
  const { data, loading, error, refresh } = useGithubData();

  if (loading && !data) {
    return <NonFollowersSkeleton />;
  }

  if (error && !data) {
    return <ErrorState code={error} onRetry={() => void refresh()} />;
  }

  const users = data ? notFollowingBack(data) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t("nonFollowersTitle")}
        description={t("nonFollowersHint")}
        backHref="/"
      />
      <ManageableUserList
        users={users}
        emptyTitle={t("nonFollowersEmptyTitle")}
        emptyDescription={t("nonFollowersEmptyBody")}
        showUnfollowAll
        unfollowAllCopy="nonFollowers"
      />
    </div>
  );
}
