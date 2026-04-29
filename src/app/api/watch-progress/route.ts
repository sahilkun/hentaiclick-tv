import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID, validateOrigin } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/watch-progress
 * Upsert the current user's progress for an episode. Called by the player
 * roughly every 15 seconds during playback, plus once on pause/unload.
 *
 * Body: { episode_id: uuid, position_seconds: number, duration_seconds: number }
 *
 * Anonymous users get 200 with `{ ok: true, anonymous: true }` and nothing
 * is persisted — the player falls back to localStorage for them.
 */
export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { episode_id, position_seconds, duration_seconds } = (body ?? {}) as {
    episode_id?: string;
    position_seconds?: number;
    duration_seconds?: number;
  };

  if (!episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid episode_id" }, { status: 400 });
  }
  // Position can be 0; duration must be > 0 (otherwise we can't compute %).
  // Cap upper bounds at 24h to reject obviously bogus payloads.
  if (
    typeof position_seconds !== "number" ||
    !Number.isFinite(position_seconds) ||
    position_seconds < 0 ||
    position_seconds > 86400
  ) {
    return NextResponse.json(
      { error: "Invalid position_seconds" },
      { status: 400 }
    );
  }
  if (
    typeof duration_seconds !== "number" ||
    !Number.isFinite(duration_seconds) ||
    duration_seconds <= 0 ||
    duration_seconds > 86400
  ) {
    return NextResponse.json(
      { error: "Invalid duration_seconds" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous: silently accept so the client doesn't need to check auth
  // before calling. Anonymous users are served by localStorage on the
  // client; this route is a no-op for them.
  if (!user) {
    return NextResponse.json({ ok: true, anonymous: true });
  }

  // Rate-limit per user: ~6 writes/min upper bound. The player throttles
  // to ~4/min normally (one every 15s), so this only fires on bugs or
  // open-tab-switching loops.
  if (!rateLimit(`wp:${user.id}`, 12, 60_000).success) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const ratio = position_seconds / duration_seconds;
  const completed = ratio >= 0.95;

  // Round to int — column is integer-typed and we don't need sub-second
  // precision for a "where did I leave off" feature.
  const pos = Math.round(position_seconds);
  const dur = Math.round(duration_seconds);

  const { error } = await supabase.from("watch_progress").upsert(
    {
      user_id: user.id,
      episode_id,
      position_seconds: pos,
      duration_seconds: dur,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,episode_id" }
  );

  if (error) {
    console.error("[watch-progress] upsert failed:", error.message);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, completed });
}
