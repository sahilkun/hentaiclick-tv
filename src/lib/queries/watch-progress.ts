import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EpisodeWithRelations } from "@/types";

/**
 * Continue Watching: episodes the current user has started but not finished.
 *
 * Filters to position/duration in (0.05, 0.9). Cards below 5% are usually
 * drive-by clicks; cards above 90% are effectively done. Both ends are
 * already excluded from `idx_watch_progress_user_recent` via the
 * `WHERE NOT completed` partial index, so the upper-bound filter is
 * essentially free.
 *
 * Returns up to `limit` episodes with their saved position, joined to
 * the full EpisodeWithRelations shape so the shelf renders identical
 * cards to the rest of the homepage.
 */
export interface ContinueWatchingItem extends EpisodeWithRelations {
  position_seconds: number;
  duration_seconds: number;
}

export async function getContinueWatching(
  limit: number = 12
): Promise<ContinueWatchingItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Pull progress rows + joined episode data in one round trip via the
  // foreign-key embed syntax. RLS limits this to the caller's own rows.
  const { data, error } = await supabase
    .from("watch_progress")
    .select(
      `
      position_seconds,
      duration_seconds,
      updated_at,
      completed,
      episode:episode_id (
        *,
        studio:studio_id (name, slug),
        series:series_id (
          title, slug, studio_id,
          studio:studio_id (name, slug)
        )
      )
    `
    )
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("updated_at", { ascending: false })
    .limit(limit * 2); // overfetch a bit; we'll filter for valid ratios

  if (error) {
    console.error("[getContinueWatching]", error.message);
    return [];
  }
  if (!data) return [];

  // Filter to "meaningful progress" range (5%..90%) and drop rows whose
  // joined episode was deleted/unpublished.
  const items: ContinueWatchingItem[] = [];
  for (const row of data) {
    const ep = row.episode as unknown as EpisodeWithRelations | null;
    if (!ep) continue;
    if ((ep as { status?: string }).status !== "published") continue;
    const ratio =
      row.duration_seconds > 0
        ? row.position_seconds / row.duration_seconds
        : 0;
    if (ratio < 0.05 || ratio > 0.9) continue;
    items.push({
      ...ep,
      position_seconds: row.position_seconds,
      duration_seconds: row.duration_seconds,
    });
    if (items.length >= limit) break;
  }
  return items;
}

/**
 * Read a single (user, episode) progress row. Used by the episode page
 * to seed the player's resume position. Returns 0 if the user is
 * anonymous or has never watched this episode.
 */
export async function getEpisodeProgress(
  episodeId: string
): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("watch_progress")
    .select("position_seconds, duration_seconds, completed")
    .eq("user_id", user.id)
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (!data) return 0;
  // Don't resume finished episodes — start from 0 instead.
  if (data.completed) return 0;
  // If we'd resume into the last 10 seconds, start from 0.
  if (data.duration_seconds - data.position_seconds < 10) return 0;
  return data.position_seconds;
}
