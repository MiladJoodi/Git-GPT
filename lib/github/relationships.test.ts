import { describe, expect, it } from "vitest";
import { calculateRelationships } from "@/lib/github/relationships";
import type { GitHubUserSummary } from "@/types/github";

function user(login: string): GitHubUserSummary {
  return {
    login,
    id: login.length,
    avatarUrl: `https://avatars.githubusercontent.com/${login}`,
    htmlUrl: `https://github.com/${login}`,
    name: login,
  };
}

describe("calculateRelationships", () => {
  const alice = user("alice");
  const bob = user("bob");
  const cara = user("cara");
  const dan = user("dan");

  it("computes mutual and not-following-back sets", () => {
    const result = calculateRelationships(
      [alice, bob, cara],
      [bob, cara, dan],
    );

    expect(result.mutual.map((item) => item.login).sort()).toEqual([
      "bob",
      "cara",
    ]);
    expect(result.notFollowingBack.map((item) => item.login)).toEqual(["dan"]);
    expect(result.followersOnly.map((item) => item.login)).toEqual(["alice"]);
  });

  it("returns everyone as not following back when there are no followers", () => {
    const result = calculateRelationships([], [alice, bob]);
    expect(result.mutual).toEqual([]);
    expect(result.notFollowingBack.map((item) => item.login)).toEqual([
      "alice",
      "bob",
    ]);
  });

  it("returns empty not-following-back when everyone follows back", () => {
    const result = calculateRelationships([alice, bob], [alice, bob]);
    expect(result.notFollowingBack).toEqual([]);
    expect(result.mutual).toHaveLength(2);
  });

  it("is deterministic for the same inputs", () => {
    const followers = [alice, bob];
    const following = [bob, cara];
    expect(calculateRelationships(followers, following)).toEqual(
      calculateRelationships(followers, following),
    );
  });
});
