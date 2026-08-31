import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { readSessionFromValue } from "@/lib/auth/session-cookie";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSessionFromValue(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isAuthenticated = Boolean(session);
  const isOAuthPath =
    pathname === "/api/auth/github" ||
    pathname === "/api/auth/github/callback";

  if (pathname.startsWith("/api/")) {
    if (isOAuthPath || pathname === "/api/auth/logout") {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuthenticated && pathname !== "/login" && pathname !== "/access") {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (isAuthenticated && pathname === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
