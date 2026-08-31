import { githubRequest } from "@/lib/github/client";
import { isValidGitHubUsername, normalizeUsername } from "@/lib/github/validate";

export async function followUser(
  accessToken: string,
  username: string,
): Promise<void> {
  const login = normalizeUsername(username);
  if (!isValidGitHubUsername(login)) {
    throw new Error("validation");
  }

  await githubRequest(
    `/user/following/${encodeURIComponent(login)}`,
    accessToken,
    {
      method: "PUT",
      headers: { "Content-Length": "0" },
    },
  );
}
