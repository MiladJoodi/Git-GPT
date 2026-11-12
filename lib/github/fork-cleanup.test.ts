import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubApiError, githubRequest } from "@/lib/github/client";
import { getRepoDetails } from "@/lib/github/cleanup-repos";
import { ForkSyncError, syncFork } from "@/lib/github/fork-cleanup";

vi.mock("@/lib/github/client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/github/client")>(
      "@/lib/github/client",
    );
  return { ...actual, githubRequest: vi.fn() };
});

vi.mock("@/lib/github/cleanup-repos", () => ({ getRepoDetails: vi.fn() }));

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function forkDetails(parent: boolean) {
  return {
    full_name: "me/thing",
    name: "thing",
    owner: { login: "me" },
    default_branch: "main",
    fork: true,
    parent: parent ? { full_name: "up/thing", default_branch: "main" } : null,
  } as never;
}

function mockGitHub(options: {
  aheadBy?: number;
  compareError?: GitHubApiError;
  merge?: () => Response;
}) {
  vi.mocked(githubRequest).mockImplementation(async (path: string) => {
    if (path.includes("/compare/")) {
      if (options.compareError) throw options.compareError;
      return json({ ahead_by: options.aheadBy ?? 0 });
    }
    if (path.includes("/merge-upstream")) {
      return options.merge
        ? options.merge()
        : json({ merge_type: "fast-forward", message: "synced" });
    }
    throw new Error(`unexpected request: ${path}`);
  });
}

async function reasonOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof ForkSyncError ? error.reason : "other";
  }
}

describe("syncFork", () => {
  beforeEach(() => {
    vi.mocked(githubRequest).mockReset();
    vi.mocked(getRepoDetails).mockReset();
  });

  it("refuses when the repository has no upstream", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(false));
    mockGitHub({});
    expect(await reasonOf(syncFork("t", "me", "thing"))).toBe("no_parent");
    expect(githubRequest).not.toHaveBeenCalled();
  });

  it("refuses when the fork is ahead of upstream", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(true));
    mockGitHub({ aheadBy: 3 });
    expect(await reasonOf(syncFork("t", "me", "thing"))).toBe("diverged");
    const paths = vi.mocked(githubRequest).mock.calls.map((c) => c[0]);
    expect(paths.some((p) => p.includes("/merge-upstream"))).toBe(false);
  });

  it("refuses when the comparison can't be determined", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(true));
    mockGitHub({ compareError: new GitHubApiError("not_found", 404) });
    expect(await reasonOf(syncFork("t", "me", "thing"))).toBe("diverged");
  });

  it("syncs a clean fork and reports the merge type", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(true));
    mockGitHub({ aheadBy: 0 });
    await expect(syncFork("t", "me", "thing")).resolves.toEqual({
      mergeType: "fast-forward",
      message: "synced",
    });
    const mergeCall = vi
      .mocked(githubRequest)
      .mock.calls.find((c) => c[0].includes("/merge-upstream"));
    expect(mergeCall?.[2]?.method).toBe("POST");
    expect(mergeCall?.[2]?.body).toBe(JSON.stringify({ branch: "main" }));
  });

  it("falls back to none for an unrecognized merge type", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(true));
    mockGitHub({
      aheadBy: 0,
      merge: () => json({ merge_type: "something-new", message: "ok" }),
    });
    const result = await syncFork("t", "me", "thing");
    expect(result.mergeType).toBe("none");
  });

  it("maps a 409 from GitHub to a conflict", async () => {
    vi.mocked(getRepoDetails).mockResolvedValue(forkDetails(true));
    mockGitHub({
      aheadBy: 0,
      merge: () => {
        throw new GitHubApiError("unknown", 409);
      },
    });
    expect(await reasonOf(syncFork("t", "me", "thing"))).toBe("conflict");
  });
});
