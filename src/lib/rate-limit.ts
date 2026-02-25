/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments; for multi-instance,
 * use Redis or edge-level rate limiting (Cloudflare / Vercel).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key   Unique identifier (e.g. IP address or `ip:endpoint`)
 * @param limit Max requests allowed within the window
 * @param windowMs Time window in milliseconds (default: 60000 = 1 min)
 * @returns { success: true } if allowed, { success: false } if rate-limited
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { success: boolean } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    return { success: false };
  }

  entry.timestamps.push(now);
  return { success: true };
}

/** Extract client IP from request headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
