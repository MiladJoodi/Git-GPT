"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { API_ERROR_KEYS } from "@/lib/i18n/core";

type ErrorStateProps = {
  kind?: "load" | "generic";
  code?: string | null;
  onRetry?: () => void;
};

export function ErrorState({
  kind = "load",
  code,
  onRetry,
}: ErrorStateProps) {
  const { t } = useI18n();
  const title =
    kind === "generic" ? t("genericErrorTitle") : t("loadErrorTitle");
  const description =
    kind === "generic"
      ? t("genericErrorBody")
      : t(API_ERROR_KEYS[code ?? "failed"] ?? "errorFailed");

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center py-16">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-5 w-fit rounded-sm" onClick={onRetry}>
          <RefreshCw />
          {t("tryAgain")}
        </Button>
      ) : null}
    </div>
  );
}
