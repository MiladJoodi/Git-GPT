const GITHUB_USERNAME =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function isValidGitHubUsername(username: string): boolean {
  if (!username || username.length > 39) {
    return false;
  }
  return GITHUB_USERNAME.test(username);
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
