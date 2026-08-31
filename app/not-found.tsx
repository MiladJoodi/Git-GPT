"use client";

import Link from "next/link";
import { BrandMark } from "@/components/app/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark title={t("brand")} />
      <p className="mt-8 font-mono text-sm text-muted-foreground">
        {t("notFoundCode")}
      </p>
      <h1 className="mt-2 text-xl font-medium">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("notFoundBody")}
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-sm")}
      >
        {t("notFoundHome")}
      </Link>
    </div>
  );
}
