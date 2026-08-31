import { describe, expect, it } from "vitest";
import { isValidGitHubUsername, normalizeUsername } from "@/lib/github/validate";

describe("isValidGitHubUsername", () => {
  it("accepts valid usernames", () => {
    expect(isValidGitHubUsername("octocat")).toBe(true);
    expect(isValidGitHubUsername("a")).toBe(true);
    expect(isValidGitHubUsername("octo-cat")).toBe(true);
    expect(isValidGitHubUsername("A1b2")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(isValidGitHubUsername("")).toBe(false);
    expect(isValidGitHubUsername("-octocat")).toBe(false);
    expect(isValidGitHubUsername("octocat-")).toBe(false);
    expect(isValidGitHubUsername("octo--cat")).toBe(false);
    expect(isValidGitHubUsername("octo cat")).toBe(false);
    expect(isValidGitHubUsername("a".repeat(40))).toBe(false);
  });

  it("trims input via normalizeUsername", () => {
    expect(normalizeUsername("  octocat  ")).toBe("octocat");
  });
});
