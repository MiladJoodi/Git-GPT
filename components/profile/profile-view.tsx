"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Moon, RefreshCw, Shield, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGithubData } from "@/components/app/github-data-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { ProfilePageSkeleton } from "@/components/feedback/skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, relativeTimeValue } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";
import { clearGithubStore } from "@/components/app/github-session-store";
import { SignOutConfirmDialog } from "@/components/dialogs/sign-out-confirm";

export function ProfileView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, refresh, syncing } = useGithubData();
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (loading && !data) {
    return <ProfilePageSkeleton />;
  }

  if (error && !data) {
    return <ErrorState code={error} onRetry={() => void refresh()} />;
  }

  if (!data) {
    return <ProfilePageSkeleton />;
  }

  const initials = (data.profile.name ?? data.profile.login)
    .slice(0, 1)
    .toUpperCase();
  const synced = relativeTimeValue(data.syncedAt);

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    clearGithubStore();
    router.replace("/login");
    router.refresh();
  }

  async function sync() {
    await refresh();
    toast.success(t("toastUpdated"));
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-4">
      <header className="flex items-center gap-3.5">
        <Avatar className="size-14">
          <AvatarImage src={data.profile.avatarUrl} alt="" />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-medium">
            {data.profile.name ?? data.profile.login}
          </h1>
          <p className="text-sm text-muted-foreground">@{data.profile.login}</p>
        </div>
      </header>

      {data.profile.bio ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {data.profile.bio}
        </p>
      ) : null}

      <dl className="mt-6 flex gap-6 text-sm">
        <Metric label={t("profileFollowers")} value={data.counts.followers} />
        <Metric label={t("profileFollowing")} value={data.counts.following} />
        <Metric label={t("profileRepos")} value={data.profile.publicRepos} />
      </dl>

      {syncing ? (
        <div className="mt-6" aria-live="polite">
          <p className="text-sm font-medium">{t("profileSyncingTitle")}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("profileSyncHint")}
          </p>
          <div className="relative mt-4 h-1 overflow-hidden bg-border">
            <div className="bulk-shimmer h-full w-1/3 bg-foreground/40" />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {synced.justNow
            ? t("updatedJustNow")
            : t("updatedAgo", { relative: synced.relative })}
        </p>
      )}

      <div
        className={`mt-8 divide-y divide-border border-y ${syncing ? "opacity-60" : ""}`}
      >
        <a
          href={data.profile.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-sm hover:opacity-70"
        >
          {t("profileOpenGithub")}
        </a>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={syncing}
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-sm hover:opacity-70 disabled:opacity-50"
        >
          <span>{syncing ? t("profileSyncing") : t("profileSync")}</span>
          <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-sm hover:opacity-70"
        >
          <span>
            {theme === "light" ? t("profileDark") : t("profileLight")}
          </span>
          {theme === "light" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </button>
        <Link
          href="/access"
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-sm hover:opacity-70"
        >
          {t("profileAccess")}
          <Shield className="size-4" />
        </Link>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="flex w-full cursor-pointer items-center justify-between py-3.5 text-sm text-destructive hover:opacity-70"
        >
          {t("signOut")}
          <LogOut className="size-4" />
        </button>
      </div>

      <SignOutConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={() => void signOut()}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-mono text-base tabular-nums">{formatCount(value)}</dd>
      <dt className="mt-0.5 text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
