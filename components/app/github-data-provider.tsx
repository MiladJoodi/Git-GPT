"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import type { RelatedUser, SyncPayload } from "@/types/github";
import {
  clearGithubStore,
  ensureGithubStoreLoaded,
  getGithubStore,
  getGithubStoreServerSnapshot,
  refreshGithubStore,
  setGithubUnauthorizedHandler,
  subscribeGithubStore,
  updateGithubStoreData,
} from "@/components/app/github-session-store";

type GithubDataContextValue = {
  data: SyncPayload | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  retryAt: number | null;
  refresh: () => Promise<void>;
  removeFollowing: (usernames: string[]) => void;
  addFollowing: (users: RelatedUser[]) => void;
};

const GithubDataContext = createContext<GithubDataContextValue | null>(null);

export function GithubDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  setGithubUnauthorizedHandler(() => {
    clearGithubStore();
    router.replace("/login?error=session_expired");
  });
  ensureGithubStoreLoaded();

  const snapshot = useSyncExternalStore(
    subscribeGithubStore,
    getGithubStore,
    getGithubStoreServerSnapshot,
  );

  const refresh = useCallback(async () => {
    await refreshGithubStore();
  }, []);

  const removeFollowing = useCallback((usernames: string[]) => {
    const removed = new Set(usernames);
    updateGithubStoreData((current) => {
      const following = current.following.filter(
        (user) => !removed.has(user.login),
      );
      const followers = current.followers.map((user) =>
        removed.has(user.login) && user.status === "mutual"
          ? { ...user, status: "follows_you" as const }
          : user,
      );

      return {
        ...current,
        following,
        followers,
        counts: {
          ...current.counts,
          following: Math.max(0, current.counts.following - removed.size),
          mutual: following.filter((user) => user.status === "mutual").length,
          notFollowingBack: following.filter(
            (user) => user.status === "not_following_back",
          ).length,
        },
      };
    });
  }, []);

  const addFollowing = useCallback((users: RelatedUser[]) => {
    updateGithubStoreData((current) => {
      const existing = new Set(current.following.map((user) => user.login));
      const incoming = users.filter((user) => !existing.has(user.login));
      if (incoming.length === 0) {
        return current;
      }

      const followerLogins = new Set(
        current.followers.map((user) => user.login),
      );
      const added = incoming.map((user) => ({
        ...user,
        status: followerLogins.has(user.login)
          ? ("mutual" as const)
          : ("not_following_back" as const),
      }));
      const addedLogins = new Set(added.map((user) => user.login));
      const following = current.following.concat(added);
      const followers = current.followers.map((user) =>
        addedLogins.has(user.login)
          ? { ...user, status: "mutual" as const }
          : user,
      );

      return {
        ...current,
        following,
        followers,
        counts: {
          ...current.counts,
          following: current.counts.following + added.length,
          mutual: following.filter((user) => user.status === "mutual").length,
          notFollowingBack: following.filter(
            (user) => user.status === "not_following_back",
          ).length,
        },
      };
    });
  }, []);

  const value = useMemo<GithubDataContextValue>(
    () => ({
      data: snapshot.data,
      loading: snapshot.status !== "ready",
      syncing: snapshot.syncing,
      error: snapshot.error,
      retryAt: snapshot.retryAt,
      refresh,
      removeFollowing,
      addFollowing,
    }),
    [snapshot, refresh, removeFollowing, addFollowing],
  );

  return (
    <GithubDataContext.Provider value={value}>
      {children}
    </GithubDataContext.Provider>
  );
}

export function useGithubData() {
  const context = useContext(GithubDataContext);
  if (!context) {
    throw new Error("useGithubData must be used within GithubDataProvider");
  }
  return context;
}

export function notFollowingBack(data: SyncPayload): RelatedUser[] {
  return data.following.filter((user) => user.status === "not_following_back");
}
