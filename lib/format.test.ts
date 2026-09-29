import { describe, expect, it } from "vitest";
import { formatCount, formatRelativeTime } from "@/lib/format";

describe("formatRelativeTime", () => {
  it("says just now for very recent updates", () => {
    expect(formatRelativeTime(1_000, 1_005)).toBe("Updated just now");
  });

  it("uses days for spans under a month", () => {
    const now = Date.parse("2026-09-23T00:00:00Z");
    expect(formatRelativeTime(now - 10 * 86_400_000, now)).toBe(
      "Updated 10 days ago",
    );
  });

  it("uses months for spans under a year", () => {
    const now = Date.parse("2026-09-23T00:00:00Z");
    expect(formatRelativeTime(now - 90 * 86_400_000, now)).toBe(
      "Updated 3 months ago",
    );
  });

  it("uses years for spans a year or longer", () => {
    const now = Date.parse("2026-09-23T00:00:00Z");
    expect(formatRelativeTime(now - 3 * 365.25 * 86_400_000, now)).toBe(
      "Updated 3 years ago",
    );
  });
});

describe("formatCount", () => {
  it("formats integers", () => {
    expect(formatCount(137)).toBe("137");
  });
});
