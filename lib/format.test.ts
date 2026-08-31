import { describe, expect, it } from "vitest";
import { formatCount, formatRelativeTime } from "@/lib/format";

describe("formatRelativeTime", () => {
  it("says just now for very recent updates", () => {
    expect(formatRelativeTime(1_000, 1_005)).toBe("Updated just now");
  });
});

describe("formatCount", () => {
  it("formats integers", () => {
    expect(formatCount(137)).toBe("137");
  });
});
