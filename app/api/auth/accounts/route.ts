import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/responses";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { getSession } from "@/lib/auth/session";
import {
  listAccounts,
  switchToAccount,
  saveCurrentAccount,
  removeAccount,
  type StoredAccount,
} from "@/lib/auth/accounts";

export const dynamic = "force-dynamic";

type AccountsPayload = {
  accounts: Array<{
    githubUserId: number;
    login: string;
    avatarUrl?: string;
    active: boolean;
  }>;
};

export async function GET() {
  const [session, accounts] = await Promise.all([
    getSession(),
    listAccounts(),
  ]);
  if (!session) {
    return jsonError("unauthorized", 401);
  }

  const payload: AccountsPayload = {
    accounts: accounts.map((account) => ({
      githubUserId: account.githubUserId,
      login: account.login,
      active: account.githubUserId === session.githubUserId,
    })),
  };
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("forbidden", 403);
  }
  const session = await getSession();
  if (!session) {
    return jsonError("unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("validation", 422);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError("validation", 422);
  }

  const action = (body as { action?: unknown }).action;

  if (action === "switch") {
    const githubUserId = (body as { githubUserId?: unknown }).githubUserId;
    if (typeof githubUserId !== "number") {
      return jsonError("validation", 422);
    }
    await saveCurrentAccount();
    const switched = await switchToAccount(githubUserId);
    if (!switched) {
      return jsonError("not_found", 404);
    }
    return NextResponse.json({ ok: true, login: switched.login });
  }

  if (action === "remove") {
    const githubUserId = (body as { githubUserId?: unknown }).githubUserId;
    if (typeof githubUserId !== "number") {
      return jsonError("validation", 422);
    }
    if (githubUserId === session.githubUserId) {
      return jsonError("validation", 422);
    }
    await removeAccount(githubUserId);
    return NextResponse.json({ ok: true });
  }

  return jsonError("validation", 422);
}
