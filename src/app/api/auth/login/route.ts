import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_TTL_SECONDS,
  createAccessToken,
  isAccessPasswordConfigured,
  verifyAccessPassword,
} from "@/lib/access-control";
import { SlidingWindowRateLimiter } from "@/lib/rate-limit";

const loginLimiter = new SlidingWindowRateLimiter(8, 15 * 60_000);

function clientAddress(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const limit = loginLimiter.check(clientAddress(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${limit.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  if (!isAccessPasswordConfigured()) {
    return NextResponse.json(
      { error: "Demo access protection is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let password: unknown;
  try {
    const body: unknown = await request.json();
    password =
      typeof body === "object" && body !== null && "password" in body
        ? body.password
        : undefined;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (typeof password !== "string" || password.length > 256) {
    return NextResponse.json(
      { error: "Enter the shared access password." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!verifyAccessPassword(password)) {
    return NextResponse.json(
      { error: "That access password is not correct." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = createAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "Demo access protection is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_SESSION_TTL_SECONDS,
  });
  return response;
}
