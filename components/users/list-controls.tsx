"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

export type SortKey = "default" | "username" | "status" | "followers" | "recency";
export type SortDirection = "asc" | "desc";
export type DisplayMode = "list" | "grid";

export type SortOption = { value: SortKey; label: string };

const FOLLOWER_RANK: Record<string, number> = {
  mutual: 0,
  follows_you: 1,
  not_following_back: 2,
};

export function sortUsers<T extends { login: string; status?: string }>(
  users: T[],
  key: SortKey,
  direction: SortDirection,
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  const sorted = [...users];
  switch (key) {
    case "username":
      sorted.sort((a, b) => sign * a.login.localeCompare(b.login));
      break;
    case "status":
      sorted.sort(
        (a, b) =>
          sign *
          ((FOLLOWER_RANK[a.status ?? ""] ?? 3) -
            (FOLLOWER_RANK[b.status ?? ""] ?? 3)),
      );
      break;
    case "recency":
      sorted.sort((a, b) => sign * a.login.localeCompare(b.login));
      break;
    default:
      return users;
  }
  return sorted;
}

type ListControlsProps = {
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortKeyChange: (key: SortKey) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  sortOptions: SortOption[];
};

export function ListControls({
  sortKey,
  sortDirection,
  onSortKeyChange,
  onSortDirectionChange,
  displayMode,
  onDisplayModeChange,
  sortOptions,
}: ListControlsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="sr-only" htmlFor="list-sort">
        {t("sortLabel")}
      </label>
      <select
        id="list-sort"
        value={sortKey}
        onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
        className="h-8 cursor-pointer rounded-sm border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label={t("sortDirectionLabel")}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-input text-muted-foreground hover:text-foreground"
        onClick={() =>
          onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
        }
      >
        {sortDirection === "asc" ? (
          <ArrowUp className="size-4" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-4" aria-hidden="true" />
        )}
      </button>
      <div className="ml-auto flex overflow-hidden rounded-sm border border-input">
        <button
          type="button"
          aria-pressed={displayMode === "list"}
          aria-label={t("displayList")}
          className={cn(
            "flex h-8 cursor-pointer items-center px-2.5 text-xs",
            displayMode === "list"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onDisplayModeChange("list")}
        >
          {t("displayList")}
        </button>
        <button
          type="button"
          aria-pressed={displayMode === "grid"}
          aria-label={t("displayGrid")}
          className={cn(
            "flex h-8 cursor-pointer items-center px-2.5 text-xs",
            displayMode === "grid"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onDisplayModeChange("grid")}
        >
          {t("displayGrid")}
        </button>
      </div>
    </div>
  );
}
