import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { unstable_cache } from "next/cache";
import { getAnonClient } from "@/lib/supabase/anon";

const getSitemapData = unstable_cache(
  async () => {
    const supabase = getAnonClient();

    const [
      { data: episodes },
      { data: series },
      { data: genres },
      { data: studios },
      { data: playlists },
    ] = await Promise.all([
      // Episode rows carry the extra fields needed for the per-episode
      // <video:video> sitemap entry (thumbnail / title / description /
      // duration / publish date).
      supabase
        .from("episodes")
        .select(
          "slug, updated_at, upload_date, title, poster_url, thumbnail_url, meta_description, description, duration_seconds"
        )
        .eq("status", "published")
        .order("upload_date", { ascending: false })
        .limit(45000),
      supabase.from("series").select("slug, updated_at").limit(1000),
      supabase.from("genres").select("slug, created_at"),
      supabase.from("studios").select("slug, created_at"),
      supabase.from("playlists").select("slug, created_at").eq("is_public", true).order("created_at", { ascending: false }).limit(500),
    ]);

    return {
      episodes: episodes ?? [],
      series: series ?? [],
      genres: genres ?? [],
      studios: studios ?? [],
      playlists: playlists ?? [],
    };
  },
  ["sitemap-data"],
  { revalidate: 86400, tags: ["episodes", "genres"] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";

  // Static pages
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/genres`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/studios`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/public-playlists`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/premium`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const { episodes, series, genres, studios, playlists } = await getSitemapData();

  const episodePages: MetadataRoute.Sitemap = episodes.map((ep: any) => {
    const pageUrl = `${siteUrl}/episode/${ep.slug}`;

    // Build a <video:video> entry so episodes surface in Google Video
    // search + the Videos tab and are eligible for video rich results.
    //   - thumbnail_loc / title / description are Google-REQUIRED.
    //   - player_loc points at the watch page: streaming sites use
    //     player_loc (the page hosting the HLS.js player) rather than
    //     content_loc, since there's no single downloadable file —
    //     and the .mkv download URLs are HMAC-gated (403 to crawlers).
    //   - family_friendly: "no" is the honest signal for adult content
    //     so Google applies SafeSearch correctly instead of
    //     mis-categorising the whole site.
    // An entry is only attached when a thumbnail exists — thumbnail_loc
    // is required and Google rejects a <video:video> without it.
    // poster_url / thumbnail_url are stored with literal spaces (the
    // schema convention). A literal space is invalid in a URL and
    // Google's video sitemap validator can reject the whole entry, so
    // percent-encode it. encodeURI leaves :// and / intact and only
    // encodes the unsafe chars (spaces), and our stored URLs are never
    // pre-encoded, so there's no double-encoding risk.
    const rawThumb: string | undefined =
      ep.poster_url || ep.thumbnail_url || undefined;
    const thumb = rawThumb ? encodeURI(rawThumb) : undefined;
    const description =
      (ep.meta_description || ep.description || "").trim() ||
      `Watch ${ep.title} on HentaiClick.`;
    const duration: number | undefined =
      ep.duration_seconds > 0 && ep.duration_seconds <= 28800
        ? ep.duration_seconds
        : undefined;

    return {
      url: pageUrl,
      lastModified: ep.updated_at ? new Date(ep.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      ...(thumb
        ? {
            videos: [
              {
                title: String(ep.title).slice(0, 100),
                thumbnail_loc: thumb,
                description: description.slice(0, 2048),
                player_loc: pageUrl,
                family_friendly: "no" as const,
                requires_subscription: "no" as const,
                ...(duration ? { duration } : {}),
                ...(ep.upload_date
                  ? { publication_date: new Date(ep.upload_date).toISOString() }
                  : {}),
              },
            ],
          }
        : {}),
    };
  });

  const seriesPages: MetadataRoute.Sitemap = series.map((s: any) => ({
    url: `${siteUrl}/series/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const genrePages: MetadataRoute.Sitemap = genres.map((g: any) => ({
    url: `${siteUrl}/genres/${g.slug}`,
    lastModified: g.created_at ? new Date(g.created_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const studioPages: MetadataRoute.Sitemap = studios.map((s: any) => ({
    url: `${siteUrl}/studios/${s.slug}`,
    lastModified: s.created_at ? new Date(s.created_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const playlistPages: MetadataRoute.Sitemap = playlists.map((p: any) => ({
    url: `${siteUrl}/playlists/${p.slug}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...episodePages,
    ...seriesPages,
    ...genrePages,
    ...studioPages,
    ...playlistPages,
  ];
}
