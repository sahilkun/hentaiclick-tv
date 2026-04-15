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
      supabase.from("episodes").select("slug, updated_at").eq("status", "published").order("upload_date", { ascending: false }).limit(45000),
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

  const episodePages: MetadataRoute.Sitemap = episodes.map((ep: any) => ({
    url: `${siteUrl}/episode/${ep.slug}`,
    lastModified: ep.updated_at ? new Date(ep.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

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
