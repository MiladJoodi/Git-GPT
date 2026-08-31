"use client";

import type { SyncPayload } from "@/types/github";
import { clearHomeIntro } from "@/lib/home-intro";

type GithubStore = {
  data: SyncPayload | null;
  error: string | null;
  retryAt: number | null;
  status: "idle" | "loading" | "ready";
  syncing: boolean;
};

const listeners = new Set<() => void>();

let store: GithubStore = {
  data: null,
  error: null,
  retryAt: null,
  status: "idle",
  syncing: false,
};

const serverSnapshot: GithubStore = {
  data: null,
  error: null,
  retryAt: null,
  status: "loading",
  syncing: false,
};

let inflight: Promise<void> | null = null;
let onUnauthorized: (() => void) | null = null;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function assign(next: GithubStore) {
  store = next;
  emit();
}

export function subscribeGithubStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGithubStore() {
  return store;
}

export function getGithubStoreServerSnapshot() {
  return serverSnapshot;
}

export function setGithubUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function fetchSync(isRefresh: boolean) {
  try {
    const response = await fetch("/api/github/sync", { cache: "no-store" });
    const body = (await response.json()) as SyncPayload & {
      error?: string;
      retryAt?: number | null;
    };

    if (response.status === 401) {
      assign({
        data: null,
        error: null,
        retryAt: null,
        status: "idle",
        syncing: false,
      });
      onUnauthorized?.();
      return;
    }

    if (!response.ok) {
      assign({
        data: isRefresh ? store.data : null,
        error: body.error ?? "failed",
        retryAt: body.retryAt ?? null,
        status: "ready",
        syncing: false,
      });
      return;
    }

    assign({
      data: body,
      error: null,
      retryAt: null,
      status: "ready",
      syncing: false,
    });
  } catch {
    assign({
      data: isRefresh ? store.data : null,
      error: "network",
      retryAt: null,
      status: "ready",
      syncing: false,
    });
  }
}

export function ensureGithubStoreLoaded() {
  if (store.status !== "idle" || inflight) {
    return;
  }

  store = {
    ...store,
    status: "loading",
    error: null,
  };

  inflight = fetchSync(false).finally(() => {
    inflight = null;
  });
}

export async function refreshGithubStore() {
  if (inflight) {
    await inflight;
  }
  assign({ ...store, syncing: true, error: null });
  inflight = fetchSync(true).finally(() => {
    inflight = null;
  });
  await inflight;
}

export function updateGithubStoreData(
  updater: (current: SyncPayload) => SyncPayload,
) {
  if (!store.data) {
    return;
  }
  assign({ ...store, data: updater(store.data) });
}

export function clearGithubStore() {
  clearHomeIntro();
  inflight = null;
  assign({
    data: null,
    error: null,
    retryAt: null,
    status: "idle",
    syncing: false,
  });
}
