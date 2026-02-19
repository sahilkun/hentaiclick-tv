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
      "cdnSlug",
      "downloadFilename",
      "status",
    ],
  });
}

export async function reindexAllEpisodes() {
  const supabase = createAdminClient();
  const client = getMeilisearchAdminClient();

  const { data: episodes, error } = await supabase
    .from("episodes")
    .select(
      `
      *,
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
    return;
  }

  // Fetch all series_genres for genre info
  const seriesIds = [
    ...new Set(episodes.map((e: any) => e.series_id).filter(Boolean)),
  ];

  const genreMap = new Map<string, { name: string; slug: string }[]>();
  if (seriesIds.length > 0) {
    const { data: genreData } = await supabase
      .from("series_genres")
      .select("series_id, genre:genre_id (name, slug)")
      .in("series_id", seriesIds);

    if (genreData) {
      for (const row of genreData as any[]) {
        if (!genreMap.has(row.series_id)) {
          genreMap.set(row.series_id, []);
        }
        if (row.genre) {
          genreMap.get(row.series_id)!.push(row.genre);
        }
      }
    }
  }

  const documents = episodes.map((ep: any) => {
    const genres = ep.series_id ? genreMap.get(ep.series_id) ?? [] : [];

    return {
      id: ep.id,
      title: ep.title,
      slug: ep.slug,
      thumbnailUrl: ep.thumbnail_url,
      seriesTitle: ep.series?.title ?? "",
      seriesSlug: ep.series?.slug ?? "",
      studioName: ep.series?.studio?.name ?? "",
      studioSlug: ep.series?.studio?.slug ?? "",
      genreNames: genres.map((g: any) => g.name),
      genreSlugs: genres.map((g: any) => g.slug),
      availableQualities: ep.available_qualities,
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
      cdnSlug: ep.cdn_slug,
      downloadFilename: ep.download_filename,
      status: ep.status,
      description: ep.meta_description ?? "",
      year: ep.release_date
        ? new Date(ep.release_date).getFullYear()
        : null,
    };
  });

  const index = client.index(INDEX_NAME);
  await index.addDocuments(documents, { primaryKey: "id" });
}

export async function syncEpisode(episodeId: string) {
  const supabase = createAdminClient();
  const client = getMeilisearchAdminClient();

  const { data: ep } = await supabase
    .from("episodes")
    .select(
      `
      *,
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

  // Fetch genres
  let genres: { name: string; slug: string }[] = [];
  if (ep.series_id) {
    const { data: genreData } = await supabase
      .from("series_genres")
      .select("genre:genre_id (name, slug)")
      .eq("series_id", ep.series_id);

    genres =
      genreData?.map((g: any) => g.genre).filter(Boolean) ?? [];
  }

  await index.addDocuments([
    {
      id: ep.id,
      title: ep.title,
      slug: ep.slug,
      thumbnailUrl: ep.thumbnail_url,
      seriesTitle: (ep as any).series?.title ?? "",
      seriesSlug: (ep as any).series?.slug ?? "",
      studioName: (ep as any).series?.studio?.name ?? "",
      studioSlug: (ep as any).series?.studio?.slug ?? "",
      genreNames: genres.map((g) => g.name),
      genreSlugs: genres.map((g) => g.slug),
      availableQualities: ep.available_qualities,
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
      cdnSlug: ep.cdn_slug,
      downloadFilename: ep.download_filename,
      status: ep.status,
      description: ep.meta_description ?? "",
      year: ep.release_date
        ? new Date(ep.release_date).getFullYear()
        : null,
    },
  ]);
}
