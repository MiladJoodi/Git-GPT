"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  backHref,
  action,
}: PageHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <header className="mb-5 shrink-0">
      <div className="flex items-start gap-1">
        {backHref ? (
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push(backHref);
              }
            }}
            className="-ms-2 mt-0.5 inline-flex size-8 cursor-pointer items-center justify-center text-foreground hover:opacity-70"
            aria-label={t("back")}
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl leading-tight font-medium">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
    </header>
  );
}
