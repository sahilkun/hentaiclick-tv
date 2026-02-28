import { unstable_cache } from "next/cache";
import { getAnonClient } from "@/lib/supabase/anon";
import type { EpisodeWithRelations } from "@/types";

/* ─── Genre by slug (cached) ─── */

export interface GenreDetail {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

async function fetchGenreBySlug(slug: string): Promise<GenreDetail | null> {
  const supabase = getAnonClient();

  const { data, error } = await supabase
    .from("genres")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch genre "${slug}": ${error.message}`);
  }
  if (!data) return null;
  return data as unknown as GenreDetail;
}

export async function getGenreBySlug(
  slug: string
): Promise<GenreDetail | null> {
  const cached = unstable_cache(
    () => fetchGenreBySlug(slug),
    ["genre", slug],
    { revalidate: 1800, tags: ["genres"] }
  );
  return cached();
}

/* ─── Genre episodes (cached) ─── */

async function fetchGenreEpisodes(
  genreId: string,
  limit: number
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

  // Get series IDs that have this genre
  const { data: seriesGenres } = await supabase
    .from("series_genres")
    .select("series_id")
    .eq("genre_id", genreId);

  const seriesIds = seriesGenres?.map((sg: any) => sg.series_id) ?? [];
  if (seriesIds.length === 0) return [];

  const { data } = await supabase
    .from("episodes")
    .select(
      `*, series:series_id (title, slug, studio:studio_id (name, slug))`
    )
    .in("series_id", seriesIds)
    .eq("status", "published")
    .order("upload_date", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as EpisodeWithRelations[];
}

export async function getGenreEpisodes(
  genreId: string,
  limit: number = 50
): Promise<EpisodeWithRelations[]> {
  const cached = unstable_cache(
    () => fetchGenreEpisodes(genreId, limit),
    ["genre-episodes", genreId, String(limit)],
    { revalidate: 1800, tags: ["episodes"] }
  );
  return cached();
}
