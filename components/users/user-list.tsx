"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RelatedUser } from "@/types/github";
import { UserRow } from "@/components/users/user-row";

type UserListProps = {
  users: RelatedUser[];
  selected?: Set<string>;
  onToggle?: (login: string, selected: boolean) => void;
  onUnfollow?: (login: string) => void;
  onFollow?: (user: RelatedUser) => void;
  onExplore?: (login: string) => void;
  onStars?: (login: string) => void;
  pendingUsername?: string | null;
  selectable?: boolean;
  showFollowAction?: boolean;
  showExploreAction?: boolean;
  showStarsAction?: boolean;
  displayMode?: "list" | "grid";
};

export function UserList({
  users,
  selected,
  onToggle,
  onUnfollow,
  onFollow,
  onExplore,
  onStars,
  pendingUsername,
  selectable = false,
  showFollowAction = false,
  showExploreAction = false,
  showStarsAction = false,
  displayMode = "list",
}: UserListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualizer is required for large GitHub graphs
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 16,
    getItemKey: (index) => users[index]?.id ?? index,
  });

  if (displayMode === "grid") {
    return (
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
        <ul
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          style={{ paddingBottom: selected && selected.size > 0 ? 96 : 8 }}
        >
          {users.map((user) => (
            <li key={user.id}>
              <UserRow
                user={user}
                selectable={selectable}
                showFollowAction={showFollowAction}
                showExploreAction={showExploreAction}
                showStarsAction={showStarsAction}
                selected={selected?.has(user.login)}
                onSelectedChange={(value) => onToggle?.(user.login, value)}
                onUnfollow={() => onUnfollow?.(user.login)}
                onFollow={() => onFollow?.(user)}
                onExplore={() => onExplore?.(user.login)}
                onStars={() => onStars?.(user.login)}
                pending={pendingUsername === user.login}
                compact
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
      <ul
        className="relative w-full"
        style={{
          height: `${Math.max(virtualizer.getTotalSize(), 1)}px`,
          paddingBottom: selected && selected.size > 0 ? 96 : 8,
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const user = users[item.index];
          return (
            <li
              key={item.key}
              className="absolute top-0 right-0 left-0"
              style={{
                height: `${item.size}px`,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <UserRow
                user={user}
                selectable={selectable}
                showFollowAction={showFollowAction}
                showExploreAction={showExploreAction}
                showStarsAction={showStarsAction}
                selected={selected?.has(user.login)}
                onSelectedChange={(value) => onToggle?.(user.login, value)}
                onUnfollow={() => onUnfollow?.(user.login)}
                onFollow={() => onFollow?.(user)}
                onExplore={() => onExplore?.(user.login)}
                onStars={() => onStars?.(user.login)}
                pending={pendingUsername === user.login}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
