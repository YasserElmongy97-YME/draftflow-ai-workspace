import { describe, it, expect } from "vitest";
import { SlidingWindowRateLimiter } from "@/lib/rate-limit";

describe("SlidingWindowRateLimiter", () => {
  it("enforces request quota and recovers after window elapses", () => {
    const limiter = new SlidingWindowRateLimiter(3, 10_000);
    const start = 1_000_000;

    expect(limiter.check("ip-1", start).allowed).toBe(true);
    expect(limiter.check("ip-1", start + 1000).allowed).toBe(true);
    expect(limiter.check("ip-1", start + 2000).allowed).toBe(true);

    const blocked = limiter.check("ip-1", start + 3000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(7);

    const recovered = limiter.check("ip-1", start + 10_500);
    expect(recovered.allowed).toBe(true);
  });
});
