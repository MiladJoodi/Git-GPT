"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { RelationshipStatus } from "@/types/github";

export function RelationshipBadge({ status }: { status: RelationshipStatus }) {
  const { t } = useI18n();
  const label =
    status === "mutual"
      ? t("statusMutual")
      : status === "not_following_back"
        ? t("statusNotBack")
        : t("statusFollowsYou");

  return (
    <span
      className={
        status === "not_following_back"
          ? "text-[12px] text-destructive"
          : "text-[12px] text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}
