"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

type FilterPillsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
};

export function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: FilterPillsProps<T>) {
  const { t } = useI18n();

  return (
    <div
      role="tablist"
      aria-label={t("filterPeople")}
      className="flex gap-4 overflow-x-auto border-b border-border"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "-mb-px cursor-pointer border-b pb-2 text-sm whitespace-nowrap",
              selected
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
