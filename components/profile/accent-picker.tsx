"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const ACCENTS = ["default", "forest", "ocean", "rose", "amber"] as const;
export type Accent = (typeof ACCENTS)[number];
const STORAGE_KEY = "gfm-accent";

export function AccentPicker() {
  const { t } = useI18n();
  const [accent, setAccent] = useState<Accent>("default");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Accent | null;
    if (stored && ACCENTS.includes(stored)) {
      setAccent(stored);
      document.documentElement.dataset.accent = stored;
    }
  }, []);

  function apply(next: Accent) {
    setAccent(next);
    if (next === "default") {
      delete document.documentElement.dataset.accent;
    } else {
      document.documentElement.dataset.accent = next;
    }
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const labels: Record<Accent, string> = {
    default: t("themeDefault"),
    forest: t("themeForest"),
    ocean: t("themeOcean"),
    rose: t("themeRose"),
    amber: t("themeAmber"),
  };

  return (
    <div className="mt-6">
      <p className="text-sm font-medium">{t("themeLabel")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ACCENTS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={accent === option}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
              accent === option
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
            onClick={() => apply(option)}
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{
                backgroundColor:
                  option === "default" ? "var(--primary)" : ACCENT_SWATCH[option],
              }}
            />
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

const ACCENT_SWATCH: Record<Exclude<Accent, "default">, string> = {
  forest: "#2e7d51",
  ocean: "#2b74a8",
  rose: "#b04468",
  amber: "#b07914",
};
