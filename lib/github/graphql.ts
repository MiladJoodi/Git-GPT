import { GitHubApiError, parseRateLimit } from "@/lib/github/client";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export async function githubGraphQL<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    throw new GitHubApiError("network", 0);
  }

  const rateLimit = parseRateLimit(response.headers);

  if (response.status === 401) {
    throw new GitHubApiError("unauthorized", 401, rateLimit);
  }
  if (!response.ok) {
    throw new GitHubApiError(
      response.status === 403 ? "forbidden" : "unknown",
      response.status,
      rateLimit,
    );
  }

  const body = (await response.json()) as {
    data?: T;
    errors?: { type?: string; message: string }[];
  };

  if (body.errors?.length) {
    const rateLimited = body.errors.some(
      (error) => error.type === "RATE_LIMITED",
    );
    throw new GitHubApiError(
      rateLimited ? "rate_limited" : "unknown",
      response.status,
      rateLimit,
    );
  }

  if (!body.data) {
    throw new GitHubApiError("unknown", response.status, rateLimit);
  }

  return body.data;
}
