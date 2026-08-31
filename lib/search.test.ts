import { describe, expect, it } from "vitest";
import { matchesSearch } from "@/lib/search";

describe("matchesSearch", () => {
  const user = { login: "octocat", name: "The Octocat" };

  it("matches login and display name", () => {
    expect(matchesSearch(user, "octo")).toBe(true);
    expect(matchesSearch(user, "THE OCTO")).toBe(true);
  });

  it("returns true for an empty query", () => {
    expect(matchesSearch(user, "  ")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesSearch(user, "hubot")).toBe(false);
  });
});
