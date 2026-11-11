import { describe, expect, it } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('sliding window rate limiter', () => {
  it('allows up to limit requests and blocks subsequent requests until window clears', () => {
    const key = `test-ip-${Date.now()}`;
    const r1 = checkRateLimit(key, 2, 60_000);
    const r2 = checkRateLimit(key, 2, 60_000);
    const r3 = checkRateLimit(key, 2, 60_000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.allowed).toBe(false);
    expect(r3.resetAfterMs).toBeGreaterThan(0);
  });
});

