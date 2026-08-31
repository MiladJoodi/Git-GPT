import type { GitHubApiErrorCode, GitHubRateLimit } from "@/types/github";

export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_API_VERSION = "2026-03-10";
export const GITHUB_ACCEPT = "application/vnd.github+json";
export const GITHUB_USER_AGENT = "GitHub-Follow-Manager";

export class GitHubApiError extends Error {
  readonly code: GitHubApiErrorCode;
  readonly status: number;
  readonly rateLimit: GitHubRateLimit | null;

  constructor(
    code: GitHubApiErrorCode,
    status: number,
    rateLimit: GitHubRateLimit | null = null,
  ) {
    super(code);
    this.name = "GitHubApiError";
    this.code = code;
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

export function parseRateLimit(headers: Headers): GitHubRateLimit {
  const remainingHeader = headers.get("x-ratelimit-remaining");
  const limitHeader = headers.get("x-ratelimit-limit");
  const resetHeader = headers.get("x-ratelimit-reset");
  const retryAfterHeader = headers.get("retry-after");

  return {
    limit: limitHeader ? Number(limitHeader) : null,
    remaining: remainingHeader ? Number(remainingHeader) : null,
    resetAt: resetHeader ? Number(resetHeader) * 1000 : null,
    retryAfterSeconds: retryAfterHeader ? Number(retryAfterHeader) : null,
  };
}

function classifyError(
  status: number,
  rateLimit: GitHubRateLimit,
  message: string,
): GitHubApiErrorCode {
  const lower = message.toLowerCase();
  const rateLimited =
    rateLimit.remaining === 0 ||
    rateLimit.retryAfterSeconds !== null ||
    lower.includes("rate limit") ||
    lower.includes("secondary rate");

  if (status === 401) {
    return "unauthorized";
  }
  if (status === 404) {
    return "not_found";
  }
  if (status === 422) {
    return "validation";
  }
  if (status === 429 || (status === 403 && rateLimited)) {
    return "rate_limited";
  }
  if (status === 403) {
    return "forbidden";
  }
  return "unknown";
}

export async function githubRequest(
  pathOrUrl: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${GITHUB_API_BASE}${pathOrUrl}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: GITHUB_ACCEPT,
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": GITHUB_USER_AGENT,
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new GitHubApiError("network", 0);
  }

  if (response.ok || response.status === 204) {
    return response;
  }

  const rateLimit = parseRateLimit(response.headers);
  let message = "";
  try {
    const body = (await response.json()) as { message?: string };
    message = body.message ?? "";
  } catch {
    message = "";
  }

  throw new GitHubApiError(
    classifyError(response.status, rateLimit, message),
    response.status,
    rateLimit,
  );
}

export function parseLinkHeader(header: string | null): {
  next?: string;
  last?: string;
} {
  if (!header) {
    return {};
  }

  const links: { next?: string; last?: string } = {};
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="(next|last)"/);
    if (match) {
      links[match[2] as "next" | "last"] = match[1];
    }
  }
  return links;
}

export async function githubPaginate<T>(
  path: string,
  accessToken: string,
  perPage = 100,
  concurrency = 5,
): Promise<T[]> {
  const firstUrl = `${GITHUB_API_BASE}${path}?per_page=${perPage}&page=1`;
  const first = await githubRequest(firstUrl, accessToken);
  const firstPage = (await first.json()) as T[];
  const links = parseLinkHeader(first.headers.get("link"));

  if (!links.next) {
    return firstPage;
  }

  if (links.last) {
    const lastUrl = new URL(links.last);
    const lastPage = Number(lastUrl.searchParams.get("page") ?? "1");
    if (Number.isFinite(lastPage) && lastPage > 1) {
      const remaining = await fetchPages<T>(
        path,
        accessToken,
        perPage,
        2,
        lastPage,
        concurrency,
      );
      return firstPage.concat(remaining);
    }
  }

  const rest: T[] = [];
  let next: string | undefined = links.next;
  while (next) {
    const response = await githubRequest(next, accessToken);
    const page = (await response.json()) as T[];
    rest.push(...page);
    next = parseLinkHeader(response.headers.get("link")).next;
  }

  return firstPage.concat(rest);
}

async function fetchPages<T>(
  path: string,
  accessToken: string,
  perPage: number,
  startPage: number,
  lastPage: number,
  concurrency: number,
): Promise<T[]> {
  const pages: T[][] = [];
  let nextPage = startPage;

  async function worker() {
    while (nextPage <= lastPage) {
      const page = nextPage;
      nextPage += 1;
      const url = `${GITHUB_API_BASE}${path}?per_page=${perPage}&page=${page}`;
      const response = await githubRequest(url, accessToken);
      pages[page - startPage] = (await response.json()) as T[];
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, lastPage - startPage + 1) },
    () => worker(),
  );
  await Promise.all(workers);
  return pages.flat();
}
