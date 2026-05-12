/**
 * Download quota for non-premium users.
 *
 * Free users (logged-in or guest) are restricted to:
 *   - 5 downloads per rolling 24h period
 *
 * Concurrency is no longer enforced: now that downloads go through R2
 * + Cloudflare, the CDN itself splits bandwidth fairly across parallel
 * streams from the same client, so a hard "1 at a time" rule is just
 * friction.
 *
 * Premium / admin / moderator users skip these checks entirely.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 5;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type QuotaResult =
  | { ok: true }
  | { ok: false; reason: "daily"; retryAfterSeconds: number };

interface CheckArgs {
  supabase: SupabaseClient;
  userId: string | null;
  ipHash: string;
}

/**
 * Check daily quota and concurrency for a user/guest.
 * Returns ok: true to proceed, or ok: false with a reason if blocked.
 *
 * For logged-in users we key by user_id; for guests we key by ip_hash.
 */
export async function checkDownloadQuota({
  supabase,
  userId,
  ipHash,
}: CheckArgs): Promise<QuotaResult> {
  const now = Date.now();
  const dayCutoff = new Date(now - DAILY_WINDOW_MS).toISOString();

  // Build the user identity filter
  const filter = userId
    ? { column: "user_id", value: userId }
    : { column: "ip_hash", value: ipHash };

  // Daily quota
  const { count: dayCount, error: dayErr } = await supabase
    .from("download_events")
    .select("*", { count: "exact", head: true })
    .eq(filter.column, filter.value)
    .gte("created_at", dayCutoff);

  if (dayErr) {
    // Fail open on DB errors so users aren't blocked by infrastructure issues
    console.error("[downloads] daily quota check failed:", dayErr.message);
    return { ok: true };
  }

  if ((dayCount ?? 0) >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      reason: "daily",
      retryAfterSeconds: Math.ceil(DAILY_WINDOW_MS / 1000),
    };
  }

  return { ok: true };
}

/**
 * Record a download event. Should be called after the quota check passes
 * and before redirecting the client to the CDN.
 */
export async function logDownloadEvent({
  supabase,
  userId,
  ipHash,
  downloadUrl,
}: CheckArgs & { downloadUrl: string }): Promise<void> {
  const { error } = await supabase.from("download_events").insert({
    user_id: userId,
    ip_hash: ipHash,
    download_url: downloadUrl,
  });
  if (error) {
    console.error("[downloads] failed to log event:", error.message);
  }
}
