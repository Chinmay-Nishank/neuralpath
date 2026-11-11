interface RateEntry {
  timestamps: number[];
}

const store = new Map<string, RateEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
}

/**
 * Sliding-window in-memory rate limiter for API routes.
 * Cleans expired entries automatically to keep memory bounded.
 */
export function checkRateLimit(
  key: string,
  limit = 15,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (store.size > 5000) {
    for (const [k, entry] of store.entries()) {
      if (entry.timestamps.every((ts) => ts < windowStart)) {
        store.delete(k);
      }
    }
  }

  const current = store.get(key) ?? { timestamps: [] };
  const recent = current.timestamps.filter((ts) => ts > windowStart);

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    store.set(key, { timestamps: recent });
    return {
      allowed: false,
      remaining: 0,
      resetAfterMs: Math.max(1000, oldest + windowMs - now),
    };
  }

  recent.push(now);
  store.set(key, { timestamps: recent });

  return {
    allowed: true,
    remaining: Math.max(0, limit - recent.length),
    resetAfterMs: windowMs,
  };
}

