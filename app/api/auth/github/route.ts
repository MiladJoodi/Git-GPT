import { NextResponse } from "next/server";
import { createPkcePair, generateRandomString } from "@/lib/auth/oauth-state";
import { buildAuthorizeUrl } from "@/lib/auth/oauth";
import { setOAuthPending } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = generateRandomString(32);
    const { codeVerifier, codeChallenge } = await createPkcePair();
    await setOAuthPending({
      state,
      codeVerifier,
      createdAt: Date.now(),
    });

    return NextResponse.redirect(buildAuthorizeUrl(state, codeChallenge));
  } catch {
    const login = new URL("/login", getAppUrl());
    login.searchParams.set("error", "config");
    return NextResponse.redirect(login);
  }
}
