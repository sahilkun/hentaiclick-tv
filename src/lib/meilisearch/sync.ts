import { getMeilisearchAdminClient } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

const INDEX_NAME = "episodes";

/** Shape of an episode row joined with studio + series relations from Supabase. */
interface EpisodeRow {
  id: string;
  title: string;
  regional_name: string | null;
  slug: string;
  thumbnail_url: string | null;
  stream_links: Record<string, string> | null;
  download_links: Record<string, string> | null;
  subtitle_links: Record<string, string> | null;
  thumbnail_path: string | null;
  gallery_urls: string[] | null;
  poster_url: string | null;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  views_7d: number;
  upload_date: string;
  release_date: string | null;
  duration_seconds: number | null;
  meta_description: string | null;
  status: string;
  series_id: string | null;
  studio?: { name: string; slug: string } | null;
  series?: {
    title: string;
    slug: string;
    studio?: { name: string; slug: string } | null;
  } | null;
}

interface GenreRef {
  name: string;
  slug: string;
}

/** Shared mapping from a Supabase episode row to a MeiliSearch document. */
function episodeToSearchDocument(
  ep: EpisodeRow,
  genres: GenreRef[]
) {
  const studioName = ep.studio?.name ?? ep.series?.studio?.name ?? "";
  const studioSlug = ep.studio?.slug ?? ep.series?.studio?.slug ?? "";

  return {
    id: ep.id,
    title: ep.title,
    regionalName: ep.regional_name ?? "",
    slug: ep.slug,
    thumbnailUrl: ep.thumbnail_url,
    seriesTitle: ep.series?.title ?? "",
    seriesSlug: ep.series?.slug ?? "",
    studioName,
    studioSlug,
    genreNames: genres.map((g) => g.name),
    genreSlugs: genres.map((g) => g.slug),
    availableQualities: Object.keys(ep.stream_links ?? {})
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b),
    ratingAvg: ep.rating_avg,
    ratingCount: ep.rating_count,
    viewCount: ep.view_count,
    likeCount: ep.like_count,
    commentCount: ep.comment_count,
    views7d: ep.views_7d,
    uploadDate: ep.upload_date,
    releaseDate: ep.release_date,
    durationSeconds: ep.duration_seconds,
    galleryUrls: ep.gallery_urls,
    posterUrl: ep.poster_url,
    status: ep.status,
    description: ep.meta_description ?? "",
    year: ep.release_date
      ? new Date(ep.release_date).getFullYear()
      : null,
  };
}

const EPISODE_WITH_RELATIONS_QUERY = `
  *,
  studio:studio_id (name, slug),
  series:series_id (
    title,
    slug,
    studio:studio_id (name, slug)
  )
`;

export async function configureIndex() {
  const client = getMeilisearchAdminClient();

  const index = client.index(INDEX_NAME);

  await index.updateSettings({
    searchableAttributes: [
      "title",
      "regionalName",
      "seriesTitle",
      "studioName",
      "genreNames",
      "description",
    ],
    filterableAttributes: [
      "genreSlugs",
      "studioSlug",
      "year",
      "availableQualities",
      "ratingAvg",
      "status",
    ],
    sortableAttributes: [
      "uploadDate",
      "releaseDate",
      "viewCount",
      "ratingAvg",
      "likeCount",
      "views7d",
      "title",
    ],
    displayedAttributes: [
      "id",
      "title",
      "regionalName",
      "slug",
      "thumbnailUrl",
      "seriesTitle",
      "seriesSlug",
      "studioName",
      "studioSlug",
      "genreNames",
      "genreSlugs",
      "availableQualities",
      "ratingAvg",
      "ratingCount",
      "viewCount",
      "likeCount",
      "commentCount",
      "views7d",
      "uploadDate",
      "releaseDate",
      "durationSeconds",
      "galleryUrls",
      "posterUrl",
      "status",
      "description",
    ],
  });
}

interface GenreRow {
  episode_id?: string;
  series_id?: string;
  genre: GenreRef | null;
}

export async function reindexAllEpisodes(): Promise<number> {
  const supabase = createAdminClient();
  const client = getMeilisearchAdminClient();

  const { data: episodes, error } = await supabase
    .from("episodes")
    .select(EPISODE_WITH_RELATIONS_QUERY)
    .eq("status", "published");

  if (error || !episodes) {
    console.error("Failed to fetch episodes for reindex:", error);
    return 0;
  }

  const typedEpisodes = episodes as unknown as EpisodeRow[];

  // Fetch episode-level genres
  const episodeIds = typedEpisodes.map((e) => e.id);
  const episodeGenreMap = new Map<string, GenreRef[]>();
  if (episodeIds.length > 0) {
    const { data: epGenreData } = await supabase
      .from("episode_genres")
      .select("episode_id, genre:genre_id (name, slug)")
      .in("episode_id", episodeIds);

    if (epGenreData) {
      for (const row of epGenreData as unknown as GenreRow[]) {
        const epId = row.episode_id!;
        if (!episodeGenreMap.has(epId)) {
          episodeGenreMap.set(epId, []);
        }
        if (row.genre) {
          episodeGenreMap.get(epId)!.push(row.genre);
        }
      }
    }
  }

  // Fetch series-level genres as fallback
  const seriesIds = [
    ...new Set(typedEpisodes.map((e) => e.series_id).filter(Boolean)),
  ] as string[];
  const seriesGenreMap = new Map<string, GenreRef[]>();
  if (seriesIds.length > 0) {
    const { data: genreData } = await supabase
      .from("series_genres")
      .select("series_id, genre:genre_id (name, slug)")
      .in("series_id", seriesIds);

    if (genreData) {
      for (const row of genreData as unknown as GenreRow[]) {
        const sId = row.series_id!;
        if (!seriesGenreMap.has(sId)) {
          seriesGenreMap.set(sId, []);
        }
        if (row.genre) {
          seriesGenreMap.get(sId)!.push(row.genre);
        }
      }
    }
  }

  const documents = typedEpisodes.map((ep) => {
    // Episode-level genres first, then fall back to series-level
    const genres =
      episodeGenreMap.get(ep.id)?.length
        ? episodeGenreMap.get(ep.id)!
        : ep.series_id
          ? seriesGenreMap.get(ep.series_id) ?? []
          : [];

    return episodeToSearchDocument(ep, genres);
  });

  const index = client.index(INDEX_NAME);
  await index.addDocuments(documents, { primaryKey: "id" });

  return documents.length;
}

export async function syncEpisode(episodeId: string) {
  const supabase = createAdminClient();
  const client = getMeilisearchAdminClient();

  const { data: ep } = await supabase
    .from("episodes")
    .select(EPISODE_WITH_RELATIONS_QUERY)
    .eq("id", episodeId)
    .single();

  if (!ep) return;

  const typedEp = ep as unknown as EpisodeRow;
  const index = client.index(INDEX_NAME);

  if (typedEp.status !== "published") {
    await index.deleteDocument(episodeId);
    return;
  }

  // Fetch episode-level genres first
  const { data: epGenreData } = await supabase
    .from("episode_genres")
    .select("genre:genre_id (name, slug)")
    .eq("episode_id", episodeId);

  let genres: GenreRef[] =
    (epGenreData as unknown as GenreRow[])
      ?.map((g) => g.genre)
      .filter((g): g is GenreRef => g !== null) ?? [];

  // Fall back to series-level genres
  if (genres.length === 0 && typedEp.series_id) {
    const { data: seriesGenreData } = await supabase
      .from("series_genres")
      .select("genre:genre_id (name, slug)")
      .eq("series_id", typedEp.series_id);

    genres =
      (seriesGenreData as unknown as GenreRow[])
        ?.map((g) => g.genre)
        .filter((g): g is GenreRef => g !== null) ?? [];
  }

  await index.addDocuments([episodeToSearchDocument(typedEp, genres)]);
}

/**
 * Lightweight sync that only updates counter/stat fields in MeiliSearch
 * (view_count, like_count, comment_count, rating_avg, rating_count, views_7d).
 * Called after views, ratings, favorites, or comments are modified.
 */
export async function syncEpisodeStats(episodeId: string) {
  try {
    const supabase = createAdminClient();
    const client = getMeilisearchAdminClient();

    const { data: ep } = await supabase
      .from("episodes")
      .select(
        "id, view_count, like_count, comment_count, rating_avg, rating_count, views_7d"
      )
      .eq("id", episodeId)
      .single();

    if (!ep) return;

    const index = client.index(INDEX_NAME);
    await index.updateDocuments([
      {
        id: ep.id,
        viewCount: ep.view_count,
        likeCount: ep.like_count,
        commentCount: ep.comment_count,
        ratingAvg: ep.rating_avg,
        ratingCount: ep.rating_count,
        views7d: ep.views_7d,
      },
    ]);
  } catch (error) {
    // Don't fail the main request if MeiliSearch sync fails
    console.error("Failed to sync episode stats to MeiliSearch:", error);
  }
}
