import type { OAuthCallbackError } from "@/types/auth";

export const LOGIN_ERROR_MESSAGES: Record<OAuthCallbackError, string> = {
  denied: "GitHub authorization was cancelled.",
  invalid_state: "This sign-in attempt was invalid. Please try again.",
  expired_state: "This sign-in attempt expired. Please try again.",
  missing_code: "GitHub did not return an authorization code.",
  token_failed: "We couldn't complete sign-in. Please try again.",
  oauth_failed: "Sign-in failed. Please try again.",
  session_expired: "Your session expired. Please sign in again.",
  config: "The app is missing GitHub OAuth configuration.",
};

export function messageForApiError(error: string | null): string {
  switch (error) {
    case "unauthorized":
      return "Your GitHub session expired. Please sign in again.";
    case "rate_limited":
      return "GitHub is rate limiting requests. Try again in a few minutes.";
    case "not_found":
      return "That GitHub account could not be found.";
    case "validation":
      return "That username is not valid.";
    case "network":
      return "A network error occurred. Check your connection and try again.";
    case "forbidden":
      return "GitHub denied this request.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function isLoginError(value: string | null): value is OAuthCallbackError {
  return value !== null && value in LOGIN_ERROR_MESSAGES;
}
