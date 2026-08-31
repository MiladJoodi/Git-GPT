import { describe, expect, it } from "vitest";
import { runBulkUnfollow, summarizeBulkResult } from "@/lib/github/bulk";

describe("runBulkUnfollow", () => {
  it("unfollows every account when all succeed", async () => {
    const seen: string[] = [];
    const result = await runBulkUnfollow(
      ["a", "b", "c"],
      async (username) => {
        seen.push(username);
      },
      { concurrency: 2 },
    );

    expect(seen.sort()).toEqual(["a", "b", "c"]);
    expect(summarizeBulkResult(result)).toEqual({
      succeeded: 3,
      failed: 0,
      aborted: 0,
    });
  });

  it("records individual failures without aborting", async () => {
    const result = await runBulkUnfollow(
      ["ok", "bad", "ok2"],
      async (username) => {
        if (username === "bad") {
          throw new Error("boom");
        }
      },
    );

    expect(result.succeeded.sort()).toEqual(["ok", "ok2"]);
    expect(result.failed).toEqual([{ username: "bad", error: "failed" }]);
    expect(result.aborted).toEqual([]);
  });

  it("aborts remaining work on rate limit", async () => {
    const result = await runBulkUnfollow(
      ["one", "two", "three", "four"],
      async (username) => {
        if (username === "two") {
          throw { code: "rate_limited" };
        }
      },
      { concurrency: 1 },
    );

    expect(result.abortReason).toBe("rate_limited");
    expect(result.succeeded).toEqual(["one"]);
    expect(result.failed[0]).toEqual({
      username: "two",
      error: "rate_limited",
    });
    expect(result.aborted.length).toBeGreaterThan(0);
  });

  it("aborts remaining work when authentication expires", async () => {
    const result = await runBulkUnfollow(
      ["one", "two", "three"],
      async (username) => {
        if (username === "one") {
          throw { code: "unauthorized" };
        }
      },
      { concurrency: 1 },
    );

    expect(result.abortReason).toBe("unauthorized");
    expect(result.succeeded).toEqual([]);
    expect(result.aborted).toContain("three");
  });

  it("stops queueing new requests when cancelled", async () => {
    const controller = new AbortController();
    const started: string[] = [];
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let resolveStarted!: () => void;
    const startedHold = new Promise<void>((resolve) => {
      resolveStarted = resolve;
    });

    const pending = runBulkUnfollow(
      ["a", "b", "c", "d"],
      async (username) => {
        started.push(username);
        if (username === "a") {
          resolveStarted();
          await hold;
        }
      },
      { concurrency: 1, signal: controller.signal },
    );

    await startedHold;
    controller.abort();
    release();

    const result = await pending;
    expect(started).toEqual(["a"]);
    expect(result.succeeded).toEqual(["a"]);
    expect(result.abortReason).toBe("cancelled");
    expect(result.aborted.sort()).toEqual(["b", "c", "d"]);
  });

  it("lets in-flight requests finish after cancel", async () => {
    const controller = new AbortController();
    const started: string[] = [];
    let releaseA!: () => void;
    const holdA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let resolveBoth!: () => void;
    const bothStarted = new Promise<void>((resolve) => {
      resolveBoth = resolve;
    });

    const pending = runBulkUnfollow(
      ["a", "b", "c", "d"],
      async (username) => {
        started.push(username);
        if (started.length >= 2) {
          resolveBoth();
        }
        if (username === "a" || username === "b") {
          await holdA;
        }
      },
      { concurrency: 2, signal: controller.signal },
    );

    await bothStarted;
    controller.abort();
    releaseA();

    const result = await pending;
    expect(started.sort()).toEqual(["a", "b"]);
    expect(result.succeeded.sort()).toEqual(["a", "b"]);
    expect(result.abortReason).toBe("cancelled");
    expect(result.aborted.sort()).toEqual(["c", "d"]);
  });
});
