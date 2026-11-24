import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  isAccessPasswordConfigured,
  verifyAccessToken,
} from "@/lib/access-control";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    if (
      pathname === "/login" &&
      isAccessPasswordConfigured() &&
      verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAccessPasswordConfigured()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Demo access protection is not configured." },
        { status: 503 },
      );
    }
    return NextResponse.redirect(new URL("/login?setup=required", request.url));
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (verifyAccessToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
