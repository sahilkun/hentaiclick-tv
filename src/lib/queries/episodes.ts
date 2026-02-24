import { createClient } from "@/lib/supabase/server";
import type { EpisodeWithRelations } from "@/types";

type SortOption =
  | "recently_uploaded"
  | "recently_released"
  | "trending"
  | "most_views"
  | "most_likes"
  | "popular_weekly"
  | "popular_monthly"
  | "highest_rated";

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
    case "highest_rated":
      query = query
        .gt("rating_count", 0)
        .order("rating_avg", { ascending: false })
        .order("rating_count", { ascending: false });
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
        studio_id,
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

export async function getEpisodesByStudio(
  studioId: string,
  excludeEpisodeId?: string,
  limit: number = 10
): Promise<EpisodeWithRelations[]> {
  const supabase = await createClient();

  // Direct studio_id on episodes
  let query = supabase
    .from("episodes")
    .select(
      `
      *,
      series:series_id (
        title,
        slug
      )
    `
    )
    .eq("studio_id", studioId)
    .eq("status", "published")
    .order("views_7d", { ascending: false })
    .limit(limit);

  if (excludeEpisodeId) {
    query = query.neq("id", excludeEpisodeId);
  }

  const { data } = await query;

  if (data && data.length > 0) {
    return data as unknown as EpisodeWithRelations[];
  }

  // Fallback: find episodes whose series belongs to this studio
  const { data: seriesData } = await supabase
    .from("series")
    .select("id")
    .eq("studio_id", studioId);

  if (!seriesData || seriesData.length === 0) return [];

  const seriesIds = seriesData.map((s) => s.id);
  let fallbackQuery = supabase
    .from("episodes")
    .select(
      `
      *,
      series:series_id (
        title,
        slug
      )
    `
    )
    .in("series_id", seriesIds)
    .eq("status", "published")
    .order("views_7d", { ascending: false })
    .limit(limit);

  if (excludeEpisodeId) {
    fallbackQuery = fallbackQuery.neq("id", excludeEpisodeId);
  }

  const { data: fallbackData } = await fallbackQuery;
  return (fallbackData ?? []) as unknown as EpisodeWithRelations[];
}

export async function getGenres() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("genres")
    .select("*")
    .order("name", { ascending: true });
  return data ?? [];
}

/** Featured genre slugs shown in the Categories section on the homepage */
const FEATURED_GENRE_SLUGS = [
  "uncensored",
  "milf",
  "maid",
  "school-girl",
  "succubus",
  "tentacle",
  "big-boobs",
  "bdsm",
  "elf",
  "4k-48fps",
];

export interface GenreWithPosters {
  id: string;
  name: string;
  slug: string;
  posters: string[]; // up to 3 poster_url values
}

/**
 * Fetches the 10 featured genres, each with up to 3 random episode poster URLs
 * for the stacked-card Categories section on the homepage.
 */
export async function getGenresWithPosters(): Promise<GenreWithPosters[]> {
  const supabase = await createClient();

  // 1. Get the 10 featured genres
  const { data: genres } = await supabase
    .from("genres")
    .select("id, name, slug")
    .in("slug", FEATURED_GENRE_SLUGS);

  if (!genres || genres.length === 0) return [];

  // 2. For each genre, fetch up to 3 random episode posters
  const results: GenreWithPosters[] = await Promise.all(
    genres.map(async (genre) => {
      // Try episode_genres first
      const { data: episodeGenres } = await supabase
        .from("episode_genres")
        .select("episode:episode_id ( poster_url )")
        .eq("genre_id", genre.id)
        .limit(20);

      let posterUrls: string[] = [];

      if (episodeGenres && episodeGenres.length > 0) {
        posterUrls = episodeGenres
          .map((eg: any) => eg.episode?.poster_url)
          .filter(Boolean);
      }

      // Fallback: try series_genres → episodes
      if (posterUrls.length === 0) {
        const { data: seriesGenres } = await supabase
          .from("series_genres")
          .select("series:series_id ( id )")
          .eq("genre_id", genre.id)
          .limit(10);

        if (seriesGenres && seriesGenres.length > 0) {
          const seriesIds = seriesGenres
            .map((sg: any) => sg.series?.id)
            .filter(Boolean);
          if (seriesIds.length > 0) {
            const { data: eps } = await supabase
              .from("episodes")
              .select("poster_url")
              .in("series_id", seriesIds)
              .not("poster_url", "is", null)
              .eq("status", "published")
              .limit(20);
            posterUrls = (eps ?? []).map((e: any) => e.poster_url).filter(Boolean);
          }
        }
      }

      // Shuffle and pick 3
      const shuffled = posterUrls.sort(() => Math.random() - 0.5);
      return {
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
        posters: shuffled.slice(0, 3),
      };
    })
  );

  // Sort results to match the FEATURED_GENRE_SLUGS order
  results.sort(
    (a, b) =>
      FEATURED_GENRE_SLUGS.indexOf(a.slug) -
      FEATURED_GENRE_SLUGS.indexOf(b.slug)
  );

  return results;
}

/* ─── Latest Comments ─── */

export interface LatestComment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  episode: {
    id: string;
    title: string;
    slug: string;
    poster_url: string | null;
    thumbnail_url: string | null;
  };
}

/**
 * Fetches the most recent comments across all episodes,
 * joined with user profile and episode info for the homepage section.
 */
export async function getLatestComments(
  limit: number = 10
): Promise<LatestComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user:user_id (
        username,
        display_name,
        avatar_url
      ),
      episode:episode_id (
        id,
        title,
        slug,
        poster_url,
        thumbnail_url
      )
    `
    )
    .eq("status", "approved")
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching latest comments:", error);
    return [];
  }

  return (data ?? []) as unknown as LatestComment[];
}
