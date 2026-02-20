import { createClient } from "@/lib/supabase/server";
import type { EpisodeWithRelations } from "@/types";

type SortOption =
  | "recently_uploaded"
  | "recently_released"
  | "trending"
  | "most_views"
  | "most_likes"
  | "popular_weekly"
  | "popular_monthly";

export async function getEpisodes(
  sort: SortOption = "recently_uploaded",
  limit: number = 12
): Promise<EpisodeWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("episodes")
    .select(
      `
      *,
      studio:studio_id (
        name,
        slug
      ),
      series:series_id (
        title,
        slug,
        studio:studio_id (
          name,
          slug
        )
      )
    `
    )
    .eq("status", "published")
    .limit(limit);

  switch (sort) {
    case "recently_uploaded":
      query = query.order("upload_date", { ascending: false });
      break;
    case "recently_released":
      query = query
        .not("release_date", "is", null)
        .order("release_date", { ascending: false });
      break;
    case "trending":
      query = query.order("views_7d", { ascending: false });
      break;
    case "most_views":
      query = query.order("view_count", { ascending: false });
      break;
    case "most_likes":
      query = query.order("like_count", { ascending: false });
      break;
    case "popular_weekly":
      query = query.order("views_7d", { ascending: false });
      break;
    case "popular_monthly":
      query = query.order("view_count", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }

  return (data ?? []) as unknown as EpisodeWithRelations[];
}

export async function getEpisodeBySlug(
  slug: string
): Promise<EpisodeWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("episodes")
    .select(
      `
      *,
      studio:studio_id (
        name,
        slug
      ),
      series:series_id (
        title,
        slug,
        studio:studio_id (
          name,
          slug
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) return null;

  // Fetch episode-level genres first
  const { data: episodeGenreData } = await supabase
    .from("episode_genres")
    .select("genre:genre_id (id, name, slug)")
    .eq("episode_id", data.id);

  let genres =
    episodeGenreData?.map((g: any) => g.genre).filter(Boolean) ?? [];

  // Fall back to series-level genres if no episode-level genres
  if (genres.length === 0 && data?.series_id) {
    const { data: seriesGenreData } = await supabase
      .from("series_genres")
      .select("genre:genre_id (id, name, slug)")
      .eq("series_id", data.series_id);

    genres =
      seriesGenreData?.map((g: any) => g.genre).filter(Boolean) ?? [];
  }

  return { ...data, genres } as unknown as EpisodeWithRelations;
}

export async function getEpisodesBySeries(
  seriesId: string,
  excludeEpisodeId?: string
): Promise<EpisodeWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("episodes")
    .select("*")
    .eq("series_id", seriesId)
    .eq("status", "published")
    .order("season_no", { ascending: true })
    .order("episode_no", { ascending: true });

  if (excludeEpisodeId) {
    query = query.neq("id", excludeEpisodeId);
  }

  const { data } = await query;
  return (data ?? []) as unknown as EpisodeWithRelations[];
}

export async function getGenres() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("genres")
    .select("*")
    .order("name", { ascending: true });
  return data ?? [];
}
