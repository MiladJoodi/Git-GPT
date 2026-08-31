import type { GitHubUserSummary } from "@/types/github";

export function matchesSearch(
  user: Pick<GitHubUserSummary, "login" | "name">,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (user.login.toLowerCase().includes(normalized)) {
    return true;
  }

  return Boolean(user.name?.toLowerCase().includes(normalized));
}
