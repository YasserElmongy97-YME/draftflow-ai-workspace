export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const timestamps = (this.store.get(key) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0];
      const resetAt = oldest + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      this.store.set(key, timestamps);

      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      resetAt: now + this.windowMs,
      retryAfterSeconds: 0,
    };
  }

  reset(key?: string) {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}

const globalLimiter = globalThis as unknown as {
  aiRateLimiter: SlidingWindowRateLimiter | undefined;
};

export function getAiRateLimiter(): SlidingWindowRateLimiter {
  if (!globalLimiter.aiRateLimiter) {
    const max = Number(process.env.AI_RATE_LIMIT_MAX || 10);
    const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000);
    globalLimiter.aiRateLimiter = new SlidingWindowRateLimiter(max, windowMs);
  }
  return globalLimiter.aiRateLimiter;
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}
