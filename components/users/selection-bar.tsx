"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type SelectionBarProps = {
  count: number;
  onUnfollow: () => void;
  onClear: () => void;
};

export function SelectionBar({ count, onUnfollow, onClear }: SelectionBarProps) {
  const { t } = useI18n();
  if (count === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t("selected", { count })}
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-5"
      style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center justify-between gap-3 border border-border bg-background px-4 py-3">
        <div>
          <p className="text-sm font-medium">{t("selected", { count })}</p>
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            {t("clearSelection")}
          </button>
        </div>
        <Button variant="destructive" className="rounded-sm" onClick={onUnfollow}>
          {t("unfollowSelected")}
        </Button>
      </div>
    </div>
  );
}
