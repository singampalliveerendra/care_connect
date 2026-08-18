/**
 * Fixed-window rate limiter for public endpoints (brief §16).
 *
 * In-memory, so the window is per server instance. That is adequate for the MVP
 * and for a single Vercel region; before real traffic this should move to a
 * shared store (Upstash Redis or Vercel KV) so limits hold across instances.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
const MAX_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 } = {},
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size > MAX_KEYS) windows.clear();
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

  return existing.count > limit
    ? { ok: false, remaining: 0, retryAfterSeconds }
    : { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
