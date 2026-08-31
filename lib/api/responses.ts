import { NextResponse } from "next/server";
import type { UnfollowErrorCode } from "@/types/github";
import { GitHubApiError } from "@/lib/github/client";
import { ReauthRequiredError } from "@/lib/auth/tokens";

export function jsonError(
  error: string,
  status: number,
  extras: Record<string, string | number | null> = {},
) {
  return NextResponse.json({ error, ...extras }, { status });
}

export function githubErrorResponse(error: unknown) {
  if (error instanceof ReauthRequiredError) {
    return jsonError("unauthorized", 401);
  }

  if (error instanceof GitHubApiError) {
    if (error.code === "unauthorized") {
      return jsonError("unauthorized", 401);
    }
    if (error.code === "rate_limited") {
      return jsonError("rate_limited", 429, {
        retryAt: error.rateLimit?.resetAt ?? null,
        retryAfterSeconds: error.rateLimit?.retryAfterSeconds ?? null,
      });
    }
    if (error.code === "not_found") {
      return jsonError("not_found", 404);
    }
    if (error.code === "validation") {
      return jsonError("validation", 422);
    }
    if (error.code === "network") {
      return jsonError("network", 503);
    }
    return jsonError("failed", 502);
  }

  if (error instanceof Error && error.message === "identity_mismatch") {
    return jsonError("unauthorized", 401);
  }

  return jsonError("failed", 500);
}

export function unfollowErrorFromApi(error: unknown): UnfollowErrorCode {
  if (error instanceof ReauthRequiredError) {
    return "unauthorized";
  }
  if (error instanceof GitHubApiError) {
    if (
      error.code === "unauthorized" ||
      error.code === "rate_limited" ||
      error.code === "not_found" ||
      error.code === "validation"
    ) {
      return error.code;
    }
  }
  if (error instanceof Error && error.message === "validation") {
    return "validation";
  }
  return "failed";
}
