import { unstable_cache } from "next/cache";
import { getAnonClient } from "@/lib/supabase/anon";
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

/* ─── Episodes (cached) ─── */

async function fetchEpisodes(
  sort: SortOption,
  limit: number
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

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

  if (!data || data.length === 0) return [];

  // Fetch genres for all episodes in one query
  const episodeIds = data.map((ep: any) => ep.id);
  const { data: egData } = await supabase
    .from("episode_genres")
    .select("episode_id, genre:genre_id (id, name, slug)")
    .in("episode_id", episodeIds);

  // Also fetch series-level genres for episodes that have a series
  const seriesIds = data
    .map((ep: any) => ep.series_id)
    .filter(Boolean) as string[];
  let sgMap: Record<string, any[]> = {};
  if (seriesIds.length > 0) {
    const { data: sgData } = await supabase
      .from("series_genres")
      .select("series_id, genre:genre_id (id, name, slug)")
      .in("series_id", seriesIds);
    for (const sg of sgData ?? []) {
      if (!sgMap[sg.series_id]) sgMap[sg.series_id] = [];
      sgMap[sg.series_id].push(sg.genre);
    }
  }

  // Build episode-genre map
  const egMap: Record<string, any[]> = {};
  for (const eg of egData ?? []) {
    if (!egMap[eg.episode_id]) egMap[eg.episode_id] = [];
    egMap[eg.episode_id].push(eg.genre);
  }

  return data.map((ep: any) => ({
    ...ep,
    genres:
      egMap[ep.id]?.filter(Boolean) ??
      (ep.series_id ? sgMap[ep.series_id]?.filter(Boolean) ?? [] : []),
  })) as unknown as EpisodeWithRelations[];
}

export async function getEpisodes(
  sort: SortOption = "recently_uploaded",
  limit: number = 12
): Promise<EpisodeWithRelations[]> {
  const cached = unstable_cache(
    () => fetchEpisodes(sort, limit),
    ["episodes", sort, String(limit)],
    { revalidate: 300, tags: ["episodes"] }
  );
  return cached();
}

/* ─── Episode by slug (cached) ─── */

async function fetchEpisodeBySlug(
  slug: string
): Promise<EpisodeWithRelations | null> {
  const supabase = getAnonClient();

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

export async function getEpisodeBySlug(
  slug: string
): Promise<EpisodeWithRelations | null> {
  const cached = unstable_cache(
    () => fetchEpisodeBySlug(slug),
    ["episode", slug],
    { revalidate: 300, tags: ["episodes"] }
  );
  return cached();
}

/* ─── Episodes by series (cached) ─── */

async function fetchEpisodesBySeries(
  seriesId: string,
  excludeEpisodeId?: string
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

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

export async function getEpisodesBySeries(
  seriesId: string,
  excludeEpisodeId?: string
): Promise<EpisodeWithRelations[]> {
  const cacheKey = excludeEpisodeId
    ? ["series-episodes", seriesId, excludeEpisodeId]
    : ["series-episodes", seriesId];
  const cached = unstable_cache(
    () => fetchEpisodesBySeries(seriesId, excludeEpisodeId),
    cacheKey,
    { revalidate: 300, tags: ["episodes"] }
  );
  return cached();
}

/* ─── Episodes by studio (cached) ─── */

async function fetchEpisodesByStudio(
  studioId: string,
  excludeEpisodeId?: string,
  limit: number = 10
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

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

  const seriesIds = seriesData.map((s: any) => s.id);
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

export async function getEpisodesByStudio(
  studioId: string,
  excludeEpisodeId?: string,
  limit: number = 10
): Promise<EpisodeWithRelations[]> {
  const cacheKey = excludeEpisodeId
    ? ["studio-episodes", studioId, excludeEpisodeId, String(limit)]
    : ["studio-episodes", studioId, String(limit)];
  const cached = unstable_cache(
    () => fetchEpisodesByStudio(studioId, excludeEpisodeId, limit),
    cacheKey,
    { revalidate: 300, tags: ["episodes"] }
  );
  return cached();
}

/* ─── Genres (cached) ─── */

export async function getGenres() {
  const cached = unstable_cache(
    async () => {
      const supabase = getAnonClient();
      const { data } = await supabase
        .from("genres")
        .select("*")
        .order("name", { ascending: true });
      return data ?? [];
    },
    ["genres"],
    { revalidate: 3600, tags: ["genres"] }
  );
  return cached();
}

/* ─── Genre posters (cached, batched — no N+1) ─── */

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

async function fetchGenresWithPosters(): Promise<GenreWithPosters[]> {
  const supabase = getAnonClient();

  // 1. Get the 10 featured genres
  const { data: genres } = await supabase
    .from("genres")
    .select("id, name, slug")
    .in("slug", FEATURED_GENRE_SLUGS);

  if (!genres || genres.length === 0) return [];

  const genreIds = genres.map((g: any) => g.id);

  // 2. Batch fetch all episode_genres rows for these genres
  const { data: allEpisodeGenres } = await supabase
    .from("episode_genres")
    .select("genre_id, episode:episode_id ( poster_url )")
    .in("genre_id", genreIds)
    .limit(200);

  // 3. Build genreId -> poster_urls map
  const posterMap: Record<string, string[]> = {};
  for (const eg of allEpisodeGenres ?? []) {
    const url = (eg as any).episode?.poster_url;
    if (!url) continue;
    if (!posterMap[eg.genre_id]) posterMap[eg.genre_id] = [];
    posterMap[eg.genre_id].push(url);
  }

  // 4. For genres with no episode-level posters, batch fallback via series_genres
  const missingGenreIds = genreIds.filter((id: any) => !posterMap[id]?.length);
  if (missingGenreIds.length > 0) {
    const { data: sgData } = await supabase
      .from("series_genres")
      .select("genre_id, series:series_id ( id )")
      .in("genre_id", missingGenreIds);

    const seriesIdSet = new Set<string>();
    const genreSeriesMap: Record<string, string[]> = {};
    for (const sg of sgData ?? []) {
      const sid = (sg as any).series?.id;
      if (!sid) continue;
      seriesIdSet.add(sid);
      if (!genreSeriesMap[sg.genre_id]) genreSeriesMap[sg.genre_id] = [];
      genreSeriesMap[sg.genre_id].push(sid);
    }

    if (seriesIdSet.size > 0) {
      const { data: eps } = await supabase
        .from("episodes")
        .select("series_id, poster_url")
        .in("series_id", Array.from(seriesIdSet))
        .not("poster_url", "is", null)
        .eq("status", "published")
        .limit(200);

      const seriesPosterMap: Record<string, string[]> = {};
      for (const ep of eps ?? []) {
        if (!ep.series_id || !ep.poster_url) continue;
        if (!seriesPosterMap[ep.series_id])
          seriesPosterMap[ep.series_id] = [];
        seriesPosterMap[ep.series_id].push(ep.poster_url);
      }

      for (const genreId of missingGenreIds) {
        const seriesIds = genreSeriesMap[genreId] ?? [];
        const urls: string[] = [];
        for (const sid of seriesIds) {
          urls.push(...(seriesPosterMap[sid] ?? []));
        }
        if (urls.length > 0) posterMap[genreId] = urls;
      }
    }
  }

  // 5. Build results — shuffle and pick 3 posters per genre
  const results: GenreWithPosters[] = genres.map((genre: any) => {
    const urls = posterMap[genre.id] ?? [];
    const shuffled = urls.sort(() => Math.random() - 0.5);
    return {
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      posters: shuffled.slice(0, 3),
    };
  });

  results.sort(
    (a, b) =>
      FEATURED_GENRE_SLUGS.indexOf(a.slug) -
      FEATURED_GENRE_SLUGS.indexOf(b.slug)
  );

  return results;
}

export async function getGenresWithPosters(): Promise<GenreWithPosters[]> {
  const cached = unstable_cache(fetchGenresWithPosters, ["genres-with-posters"], {
    revalidate: 3600,
    tags: ["genres"],
  });
  return cached();
}

/* ─── Latest Comments (cached) ─── */

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

async function fetchLatestComments(limit: number): Promise<LatestComment[]> {
  const supabase = getAnonClient();

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

export async function getLatestComments(
  limit: number = 10
): Promise<LatestComment[]> {
  const cached = unstable_cache(
    () => fetchLatestComments(limit),
    ["latest-comments", String(limit)],
    { revalidate: 120, tags: ["comments"] }
  );
  return cached();
}
