"use client";

import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandMark } from "@/components/app/brand-mark";
import { GitHubMark } from "@/components/app/github-mark";
import { useI18n } from "@/components/i18n/i18n-provider";
import { LOGIN_ERROR_KEYS } from "@/lib/i18n/core";

export function LoginScreen({ error }: { error: string | null }) {
  const { t } = useI18n();
  const message =
    error && LOGIN_ERROR_KEYS[error] ? t(LOGIN_ERROR_KEYS[error]) : null;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
        <header className="flex items-center gap-3">
          <BrandMark title={t("brand")} />
          <p className="text-sm font-medium">{t("brand")}</p>
        </header>

        <div className="flex flex-1 flex-col justify-center py-16">
          <h1 className="text-[2.35rem] leading-[1.15] font-medium">
            {t("loginLine1")}
            <br />
            {t("loginLine2")}
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-7 text-muted-foreground">
            {t("loginTrust")}{" "}
            <Link
              href="/access"
              className="cursor-pointer text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              {t("loginMore")}
            </Link>
          </p>

          {message ? (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <p className="mt-10 text-xs leading-5 text-muted-foreground">
            {t("loginChipPassword")}
            <span className="mx-2 text-border">/</span>
            {t("loginChipRepos")}
            <span className="mx-2 text-border">/</span>
            {t("loginChipRevoke")}
          </p>
        </div>

        <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <a
            href="/api/auth/github"
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 border border-foreground bg-foreground text-sm font-medium text-background hover:opacity-90"
          >
            <GitHubMark className="size-4" />
            {t("loginContinue")}
          </a>
        </div>
      </div>
    </div>
  );
}
