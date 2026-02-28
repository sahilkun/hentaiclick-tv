import { unstable_cache } from "next/cache";
import { getAnonClient } from "@/lib/supabase/anon";
import type { EpisodeWithRelations } from "@/types";

/* ─── Series by slug (cached) ─── */

interface StudioRef {
  name: string;
  slug: string;
}

export interface SeriesWithStudio {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  meta_description?: string | null;
  cover_url?: string | null;
  year?: number | null;
  status: string;
  studio?: StudioRef | null;
  [key: string]: unknown;
}

async function fetchSeriesBySlug(
  slug: string
): Promise<SeriesWithStudio | null> {
  const supabase = getAnonClient();

  const { data, error } = await supabase
    .from("series")
    .select(`*, studio:studio_id (name, slug)`)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as unknown as SeriesWithStudio;
}

export async function getSeriesBySlug(
  slug: string
): Promise<SeriesWithStudio | null> {
  const cached = unstable_cache(
    () => fetchSeriesBySlug(slug),
    ["series", slug],
    { revalidate: 300, tags: ["series"] }
  );
  return cached();
}

/* ─── Series genres (cached) ─── */

export interface GenreRef {
  id: string;
  name: string;
  slug: string;
}

async function fetchSeriesGenres(seriesId: string): Promise<GenreRef[]> {
  const supabase = getAnonClient();

  const { data } = await supabase
    .from("series_genres")
    .select("genre:genre_id (id, name, slug)")
    .eq("series_id", seriesId);

  return data?.map((g: any) => g.genre).filter(Boolean) ?? [];
}

export async function getSeriesGenres(seriesId: string): Promise<GenreRef[]> {
  const cached = unstable_cache(
    () => fetchSeriesGenres(seriesId),
    ["series-genres", seriesId],
    { revalidate: 300, tags: ["series"] }
  );
  return cached();
}

/* ─── Series episodes (cached) ─── */

async function fetchSeriesEpisodes(
  seriesId: string
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

  const { data } = await supabase
    .from("episodes")
    .select(
      `*, series:series_id (title, slug, studio:studio_id (name, slug))`
    )
    .eq("series_id", seriesId)
    .eq("status", "published")
    .order("season_no", { ascending: true })
    .order("episode_no", { ascending: true });

  return (data ?? []) as unknown as EpisodeWithRelations[];
}

export async function getSeriesEpisodes(
  seriesId: string
): Promise<EpisodeWithRelations[]> {
  const cached = unstable_cache(
    () => fetchSeriesEpisodes(seriesId),
    ["series-episodes-page", seriesId],
    { revalidate: 300, tags: ["episodes"] }
  );
  return cached();
}
