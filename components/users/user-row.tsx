"use client";

import { LoaderCircle } from "lucide-react";
import type { RelatedUser } from "@/types/github";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RelationshipBadge } from "@/components/users/relationship-badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

type UserRowProps = {
  user: RelatedUser;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onUnfollow?: () => void;
  onFollow?: () => void;
  pending?: boolean;
  selectable?: boolean;
  showFollowAction?: boolean;
};

export function UserRow({
  user,
  selected = false,
  onSelectedChange,
  onUnfollow,
  onFollow,
  pending = false,
  selectable = false,
  showFollowAction = false,
}: UserRowProps) {
  const { t } = useI18n();
  const initials = (user.name ?? user.login).slice(0, 1).toUpperCase();
  const canFollow = showFollowAction && user.status === "follows_you";
  const canUnfollow = showFollowAction
    ? user.status === "mutual" || user.status === "not_following_back"
    : selectable || Boolean(onUnfollow);

  return (
    <article
      className={cn(
        "flex h-full items-center gap-3 border-b border-border",
        selected && "bg-muted/50",
      )}
    >
      {selectable ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange?.(Boolean(value))}
          aria-label={`${t("selectAll")} @${user.login}`}
        />
      ) : null}

      <a
        href={user.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-sm"
        aria-label={t("openOnGithub", { login: user.login })}
      >
        <Avatar className="size-9">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium leading-tight underline-offset-2 hover:underline">
            {user.name ?? user.login}
          </span>
          <span className="block truncate text-[12px] text-muted-foreground">
            @{user.login}
            <span className="mx-1.5">·</span>
            <RelationshipBadge status={user.status} />
          </span>
        </span>
      </a>

      {canFollow ? (
        <FollowActionButton
          label={t("follow")}
          pending={pending}
          variant="default"
          ariaLabel={`${t("follow")} @${user.login}`}
          onClick={onFollow}
        />
      ) : null}

      {canUnfollow && !canFollow ? (
        <FollowActionButton
          label={t("unfollow")}
          pending={pending}
          variant="outline"
          ariaLabel={`${t("unfollow")} @${user.login}`}
          onClick={onUnfollow}
        />
      ) : null}
    </article>
  );
}

function FollowActionButton({
  label,
  pending,
  variant,
  ariaLabel,
  onClick,
}: {
  label: string;
  pending: boolean;
  variant: "default" | "outline";
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      className="relative h-7 w-[5.75rem] shrink-0 rounded-sm transition-none"
      disabled={pending}
      aria-busy={pending}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className={cn(pending && "invisible")}>{label}</span>
      {pending ? (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <LoaderCircle className="size-3.5 animate-spin" />
        </span>
      ) : null}
    </Button>
  );
}
