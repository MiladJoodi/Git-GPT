"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  Compass,
  LoaderCircle,
  Star,
  UserPlus,
  WandSparkles,
} from "lucide-react";
import {
  notFollowingBack,
  useGithubData,
} from "@/components/app/github-data-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { HomeSkeleton } from "@/components/feedback/skeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { consumeHomeIntro } from "@/lib/home-intro";
import { formatCount } from "@/lib/format";
import { useCountUp } from "@/hooks/use-count-up";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { SyncPayload } from "@/types/github";

export function HomeView() {
  const { data, loading, error, refresh, syncing } = useGithubData();

  if (loading && !data) {
    return <HomeSkeleton />;
  }

  if (error && !data) {
    return <ErrorState code={error} onRetry={() => void refresh()} />;
  }

  if (!data) {
    return <HomeSkeleton />;
  }

  return <HomeReady data={data} syncing={syncing} />;
}

function HomeReady({
  data,
  syncing,
}: {
  data: SyncPayload;
  syncing: boolean;
}) {
  const { t } = useI18n();
  const [playIntro] = useState(() => consumeHomeIntro());
  const [phase, setPhase] = useState<"counting" | "ready">("counting");

  const followers = data.counts.followers;
  const following = data.counts.following;
  const mutual = data.counts.mutual;
  const notBack = data.counts.notFollowingBack;

  const followersCount = useCountUp(followers, {
    play: playIntro,
    active: playIntro,
  });
  const followingCount = useCountUp(following, {
    play: playIntro,
    active: playIntro,
  });
  const mutualCount = useCountUp(mutual, {
    play: playIntro,
    active: playIntro,
  });

  const countsDone =
    followersCount.done && followingCount.done && mutualCount.done;
  const showAnalysis = playIntro ? phase === "ready" : true;

  useEffect(() => {
    if (!playIntro || !countsDone || phase !== "counting") {
      return;
    }
    const id = window.setTimeout(() => setPhase("ready"), 240);
    return () => window.clearTimeout(id);
  }, [playIntro, countsDone, phase]);

  const pending = notFollowingBack(data);
  const displayName = data.profile.name ?? data.profile.login;
  const initials = displayName.slice(0, 1).toUpperCase();

  const stats = [
    { label: t("homeFollowers"), value: followersCount.value },
    { label: t("homeFollowing"), value: followingCount.value },
    { label: t("homeMutual"), value: mutualCount.value },
  ];

  const tools = [
    {
      href: "/manager",
      icon: Compass,
      title: t("homeToolExplore"),
      hint: t("homeToolExploreHint"),
      vip: false,
    },
    {
      href: "/stars",
      icon: Star,
      title: t("homeToolStars"),
      hint: t("homeToolStarsHint"),
      vip: false,
    },
    {
      href: "/crawler",
      icon: Bot,
      title: t("homeToolCrawler"),
      hint: t("homeToolCrawlerHint"),
      vip: true,
    },
    {
      href: "/auto-follow-back",
      icon: UserPlus,
      title: t("autoFollowBack"),
      hint: t("autoFollowBackHint"),
      vip: false,
    },
    {
      href: "/activity",
      icon: CalendarDays,
      title: t("homeToolActivity"),
      hint: t("homeToolActivityHint"),
      vip: false,
    },
  ] as const;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-4">
      <header className="flex items-center gap-3.5">
        <Avatar className="size-14">
          <AvatarImage src={data.profile.avatarUrl} alt="" />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-medium leading-tight">
            {t("homeWelcome", { name: displayName.split(" ")[0] ?? displayName })}
          </h1>
          <a
            href={data.profile.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-block truncate text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            @{data.profile.login}
          </a>
        </div>
      </header>

      {syncing ? (
        <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          {t("profileSyncingTitle")}
        </p>
      ) : null}

      <dl className="mt-8 divide-y divide-border border-y">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-baseline justify-between py-3.5"
          >
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-lg tabular-nums tracking-tight">
              {formatCount(stat.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 min-h-[10.5rem]">
        {playIntro && !showAnalysis ? (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 shrink-0 animate-spin" />
            {t("homeSearching")}
          </div>
        ) : null}

        {showAnalysis ? (
          pending.length === 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-xl font-medium">{t("homeCaughtUp")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("homeCaughtUpBody")}
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="font-mono text-6xl leading-none tabular-nums tracking-tight text-mark">
                {formatCount(notBack)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {notBack === 1 ? t("homeNotBackOne") : t("homeNotBackMany")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("homeSweepHint")}
              </p>
              <Link
                href="/non-followers"
                className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 border border-foreground bg-foreground text-sm font-medium text-background hover:opacity-90"
              >
                <WandSparkles className="size-4" />
                {t("homeSweep")}
              </Link>
            </div>
          )
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-foreground">
          {t("homeToolsTitle")}
        </h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex items-center gap-3 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <Icon
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {tool.title}
                      </span>
                      {tool.vip ? (
                        <span className="shrink-0 border border-mark/40 bg-mark/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-mark">
                          {t("homeToolVip")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {tool.hint}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
