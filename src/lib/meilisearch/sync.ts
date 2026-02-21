import { getMeilisearchAdminClient } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

const INDEX_NAME = "episodes";

export async function configureIndex() {
  const client = getMeilisearchAdminClient();

  const index = client.index(INDEX_NAME);

  await index.updateSettings({
    searchableAttributes: [
      "title",
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
      "streamLinks",
      "subtitleLinks",
      "downloadLinks",
      "thumbnailPath",
      "status",
    ],
  });
}

export async function reindexAllEpisodes(): Promise<number> {
  const supabase = createAdminClient();
  const client = getMeilisearchAdminClient();

  const { data: episodes, error } = await supabase
    .from("episodes")
    .select(
      `
      *,
      studio:studio_id (name, slug),
      series:series_id (
        title,
        slug,
        studio:studio_id (name, slug)
      )
    `
    )
    .eq("status", "published");

  if (error || !episodes) {
    console.error("Failed to fetch episodes for reindex:", error);
    return 0;
  }

  // Fetch episode-level genres
  const episodeIds = episodes.map((e: any) => e.id);
  const episodeGenreMap = new Map<string, { name: string; slug: string }[]>();
  if (episodeIds.length > 0) {
    const { data: epGenreData } = await supabase
      .from("episode_genres")
      .select("episode_id, genre:genre_id (name, slug)")
      .in("episode_id", episodeIds);

    if (epGenreData) {
      for (const row of epGenreData as any[]) {
        if (!episodeGenreMap.has(row.episode_id)) {
          episodeGenreMap.set(row.episode_id, []);
        }
        if (row.genre) {
          episodeGenreMap.get(row.episode_id)!.push(row.genre);
        }
      }
    }
  }

  // Fetch series-level genres as fallback
  const seriesIds = [
    ...new Set(episodes.map((e: any) => e.series_id).filter(Boolean)),
  ];
  const seriesGenreMap = new Map<string, { name: string; slug: string }[]>();
  if (seriesIds.length > 0) {
    const { data: genreData } = await supabase
      .from("series_genres")
      .select("series_id, genre:genre_id (name, slug)")
      .in("series_id", seriesIds);

    if (genreData) {
      for (const row of genreData as any[]) {
        if (!seriesGenreMap.has(row.series_id)) {
          seriesGenreMap.set(row.series_id, []);
        }
        if (row.genre) {
          seriesGenreMap.get(row.series_id)!.push(row.genre);
        }
      }
    }
  }

  const documents = episodes.map((ep: any) => {
    // Episode-level genres first, then fall back to series-level
    const genres =
      episodeGenreMap.get(ep.id)?.length
        ? episodeGenreMap.get(ep.id)!
        : ep.series_id
          ? seriesGenreMap.get(ep.series_id) ?? []
          : [];

    // Episode-level studio first, then fall back to series studio
    const studioName = ep.studio?.name ?? ep.series?.studio?.name ?? "";
    const studioSlug = ep.studio?.slug ?? ep.series?.studio?.slug ?? "";

    return {
      id: ep.id,
      title: ep.title,
      slug: ep.slug,
      thumbnailUrl: ep.thumbnail_url,
      seriesTitle: ep.series?.title ?? "",
      seriesSlug: ep.series?.slug ?? "",
      studioName,
      studioSlug,
      genreNames: genres.map((g: any) => g.name),
      genreSlugs: genres.map((g: any) => g.slug),
      availableQualities: Object.keys(ep.stream_links ?? {}).map(Number).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b),
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
      streamLinks: ep.stream_links,
      subtitleLinks: ep.subtitle_links,
      downloadLinks: ep.download_links,
      thumbnailPath: ep.thumbnail_path,
      status: ep.status,
      description: ep.meta_description ?? "",
      year: ep.release_date
        ? new Date(ep.release_date).getFullYear()
        : null,
    };
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
    .select(
      `
      *,
      studio:studio_id (name, slug),
      series:series_id (
        title,
        slug,
        studio:studio_id (name, slug)
      )
    `
    )
    .eq("id", episodeId)
    .single();

  if (!ep) return;

  const index = client.index(INDEX_NAME);

  if (ep.status !== "published") {
    await index.deleteDocument(episodeId);
    return;
  }

  // Fetch episode-level genres first
  const { data: epGenreData } = await supabase
    .from("episode_genres")
    .select("genre:genre_id (name, slug)")
    .eq("episode_id", episodeId);

  let genres: { name: string; slug: string }[] =
    epGenreData?.map((g: any) => g.genre).filter(Boolean) ?? [];

  // Fall back to series-level genres
  if (genres.length === 0 && ep.series_id) {
    const { data: seriesGenreData } = await supabase
      .from("series_genres")
      .select("genre:genre_id (name, slug)")
      .eq("series_id", ep.series_id);

    genres =
      seriesGenreData?.map((g: any) => g.genre).filter(Boolean) ?? [];
  }

  // Episode-level studio first, then fall back to series studio
  const studioName =
    (ep as any).studio?.name ?? (ep as any).series?.studio?.name ?? "";
  const studioSlug =
    (ep as any).studio?.slug ?? (ep as any).series?.studio?.slug ?? "";

  await index.addDocuments([
    {
      id: ep.id,
      title: ep.title,
      slug: ep.slug,
      thumbnailUrl: ep.thumbnail_url,
      seriesTitle: (ep as any).series?.title ?? "",
      seriesSlug: (ep as any).series?.slug ?? "",
      studioName,
      studioSlug,
      genreNames: genres.map((g) => g.name),
      genreSlugs: genres.map((g) => g.slug),
      availableQualities: Object.keys(ep.stream_links ?? {}).map(Number).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b),
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
      streamLinks: ep.stream_links,
      subtitleLinks: ep.subtitle_links,
      downloadLinks: ep.download_links,
      thumbnailPath: ep.thumbnail_path,
      status: ep.status,
      description: ep.meta_description ?? "",
      year: ep.release_date
        ? new Date(ep.release_date).getFullYear()
        : null,
    },
  ]);
}
