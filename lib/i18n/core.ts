import { en, type MessageKey } from "@/lib/i18n/en";

export type { MessageKey };
export type { Messages } from "@/lib/i18n/en";

export function interpolate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}

export function translate(
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  return interpolate(en[key], vars);
}

export const LOGIN_ERROR_KEYS: Record<string, MessageKey> = {
  denied: "errorDenied",
  invalid_state: "errorInvalidState",
  expired_state: "errorExpiredState",
  missing_code: "errorMissingCode",
  token_failed: "errorTokenFailed",
  oauth_failed: "errorOauthFailed",
  session_expired: "errorSessionExpired",
  config: "errorConfig",
};

export const API_ERROR_KEYS: Record<string, MessageKey> = {
  unauthorized: "errorUnauthorized",
  rate_limited: "errorRateLimited",
  not_found: "errorNotFound",
  validation: "errorValidation",
  network: "errorNetwork",
  forbidden: "errorForbidden",
  failed: "errorFailed",
};
