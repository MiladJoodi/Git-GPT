"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, House } from "lucide-react";
import { BrandMark } from "@/components/app/brand-mark";
import { GitHubMark } from "@/components/app/github-mark";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AccessScreen({ signedIn = false }: { signedIn?: boolean }) {
  const router = useRouter();
  const { t } = useI18n();

  const sections = [
    { title: t("accessNoPasswordTitle"), body: t("accessNoPassword") },
    {
      title: t("accessWhatTitle"),
      body: [t("accessIdentify"), t("accessRead"), t("accessUnfollow")],
    },
    {
      title: t("accessNeverTitle"),
      body: [t("accessNeverRepos"), t("accessNeverEmail")],
    },
    { title: t("accessTokenTitle"), body: t("accessToken") },
    { title: t("accessRevokeTitle"), body: t("accessRevoke") },
  ] as const;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-6 py-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/login");
            }
          }}
          className="-ms-2 inline-flex h-9 cursor-pointer items-center gap-1 px-2 text-sm hover:opacity-70"
        >
          <ChevronLeft className="size-4" />
          {t("accessBack")}
        </button>

        <div className="mt-8 flex items-center gap-3">
          <BrandMark title={t("brand")} />
          <p className="text-sm font-medium">{t("brand")}</p>
        </div>

        <h1 className="mt-8 text-2xl font-medium">{t("accessTitle")}</h1>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
          {t("accessLead")}
        </p>

        <ol className="mt-10 divide-y divide-border border-y">
          {sections.map((section, index) => (
            <li key={section.title} className="grid grid-cols-[2.25rem_1fr] gap-3 py-5">
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-sm font-medium">{section.title}</h2>
                {Array.isArray(section.body) ? (
                  <ul className="mt-2 space-y-1.5 text-sm leading-6 text-muted-foreground">
                    {section.body.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {section.body}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <a
          href="https://github.com/settings/applications"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex cursor-pointer text-sm underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {t("accessGithubApps")}
        </a>

        <div className="mt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a
            href={signedIn ? "/" : "/api/auth/github"}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 border border-foreground bg-foreground text-sm font-medium text-background hover:opacity-90"
          >
            {signedIn ? <House className="size-4" /> : <GitHubMark className="size-4" />}
            {signedIn ? t("notFoundHome") : t("accessSignIn")}
          </a>
        </div>
      </div>
    </div>
  );
}
