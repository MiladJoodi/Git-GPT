import { describe, expect, it } from "vitest";
import { validateOAuthState } from "@/lib/auth/oauth-state";

describe("validateOAuthState", () => {
  const pending = {
    state: "abc123",
    codeVerifier: "verifier",
    createdAt: 1_000_000,
  };

  it("accepts a matching fresh state", () => {
    expect(validateOAuthState(pending, "abc123", 1_000_000)).toBe("ok");
  });

  it("rejects a missing returned state", () => {
    expect(validateOAuthState(pending, null, 1_000_000)).toBe("missing_state");
  });

  it("rejects a missing pending cookie", () => {
    expect(validateOAuthState(null, "abc123", 1_000_000)).toBe(
      "missing_pending",
    );
  });

  it("rejects a mismatched state", () => {
    expect(validateOAuthState(pending, "other", 1_000_000)).toBe("mismatch");
  });

  it("rejects an expired state", () => {
    expect(
      validateOAuthState(pending, "abc123", pending.createdAt + 11 * 60 * 1000),
    ).toBe("expired");
  });
});
