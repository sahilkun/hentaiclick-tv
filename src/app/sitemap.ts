import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/genres`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/studios`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/playlists`, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/premium`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Episodes
  const { data: episodes } = await supabase
    .from("episodes")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("upload_date", { ascending: false })
    .limit(5000);

  const episodePages: MetadataRoute.Sitemap = (episodes ?? []).map((ep) => ({
    url: `${siteUrl}/episode/${ep.slug}`,
    lastModified: ep.updated_at ? new Date(ep.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Series
  const { data: series } = await supabase
    .from("series")
    .select("slug, updated_at")
    .limit(1000);

  const seriesPages: MetadataRoute.Sitemap = (series ?? []).map((s) => ({
    url: `${siteUrl}/series/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Genres
  const { data: genres } = await supabase.from("genres").select("slug");

  const genrePages: MetadataRoute.Sitemap = (genres ?? []).map((g) => ({
    url: `${siteUrl}/genres/${g.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Studios
  const { data: studios } = await supabase.from("studios").select("slug");

  const studioPages: MetadataRoute.Sitemap = (studios ?? []).map((s) => ({
    url: `${siteUrl}/studios/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...episodePages,
    ...seriesPages,
    ...genrePages,
    ...studioPages,
  ];
}
