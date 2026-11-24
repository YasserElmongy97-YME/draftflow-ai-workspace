import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_PASSWORD_MIN_LENGTH,
  ACCESS_SESSION_TTL_SECONDS,
  createAccessToken,
  isAccessPasswordConfigured,
  verifyAccessPassword,
  verifyAccessToken,
} from "@/lib/access-control";

const validPassword = "draftflow-private-demo-access-phrase-2026";

function setPassword(password: string | undefined) {
  if (password === undefined) {
    vi.stubEnv("DEMO_ACCESS_PASSWORD", "");
  } else {
    vi.stubEnv("DEMO_ACCESS_PASSWORD", password);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo access control", () => {
  it("requires a sufficiently long configured password", () => {
    setPassword("short");
    expect(isAccessPasswordConfigured()).toBe(false);
    expect(createAccessToken()).toBeNull();

    setPassword("x".repeat(ACCESS_PASSWORD_MIN_LENGTH));
    expect(isAccessPasswordConfigured()).toBe(true);
  });

  it("compares the candidate password without accepting a wrong value", () => {
    setPassword(validPassword);
    expect(verifyAccessPassword(validPassword)).toBe(true);
    expect(verifyAccessPassword(`${validPassword}!`)).toBe(false);
    expect(verifyAccessPassword("x".repeat(300))).toBe(false);
  });

  it("signs a short-lived token and rejects tampered or expired tokens", () => {
    setPassword(validPassword);
    const now = 1_700_000_000_000;
    const token = createAccessToken(now);

    expect(token).not.toBeNull();
    expect(verifyAccessToken(token ?? undefined, now)).toBe(true);
    expect(verifyAccessToken(`${token}x`, now)).toBe(false);
    expect(
      verifyAccessToken(
        token ?? undefined,
        now + ACCESS_SESSION_TTL_SECONDS * 1000,
      ),
    ).toBe(false);
  });

  it("rejects tokens if the configured password changes", () => {
    setPassword(validPassword);
    const token = createAccessToken();

    setPassword(`${validPassword}-rotated`);
    expect(verifyAccessToken(token ?? undefined)).toBe(false);
  });
});
