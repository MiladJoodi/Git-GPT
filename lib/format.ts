export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function relativeTimeValue(
  timestamp: number,
  now = Date.now(),
): { justNow: true } | { justNow: false; relative: string } {
  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 8) {
    return { justNow: true };
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 60) {
    return { justNow: false, relative: formatter.format(-seconds, "second") };
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return { justNow: false, relative: formatter.format(-minutes, "minute") };
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return { justNow: false, relative: formatter.format(-hours, "hour") };
  }
  const days = Math.round(hours / 24);
  if (days < 30) {
    return { justNow: false, relative: formatter.format(-days, "day") };
  }
  const months = Math.round(days / 30.44);
  if (months < 12) {
    return { justNow: false, relative: formatter.format(-months, "month") };
  }
  const years = Math.round(days / 365.25);
  return { justNow: false, relative: formatter.format(-years, "year") };
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const value = relativeTimeValue(timestamp, now);
  if (value.justNow) {
    return "Updated just now";
  }
  return `Updated ${value.relative}`;
}

export function formatRetryAt(retryAt: number | null): string {
  if (!retryAt) {
    return "a little later";
  }
  const date = new Date(retryAt);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
