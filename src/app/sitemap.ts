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
    { url: `${siteUrl}/public-playlists`, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/premium`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Fetch all dynamic data in parallel for performance
  const [
    { data: episodes },
    { data: series },
    { data: genres },
    { data: studios },
    { data: playlists },
  ] = await Promise.all([
    supabase.from("episodes").select("slug, updated_at").eq("status", "published").order("upload_date", { ascending: false }).limit(5000),
    supabase.from("series").select("slug, updated_at").limit(1000),
    supabase.from("genres").select("slug"),
    supabase.from("studios").select("slug"),
    supabase.from("playlists").select("slug, created_at").eq("is_public", true).order("created_at", { ascending: false }).limit(500),
  ]);

  const episodePages: MetadataRoute.Sitemap = (episodes ?? []).map((ep) => ({
    url: `${siteUrl}/episode/${ep.slug}`,
    lastModified: ep.updated_at ? new Date(ep.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const seriesPages: MetadataRoute.Sitemap = (series ?? []).map((s) => ({
    url: `${siteUrl}/series/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const genrePages: MetadataRoute.Sitemap = (genres ?? []).map((g) => ({
    url: `${siteUrl}/genres/${g.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const studioPages: MetadataRoute.Sitemap = (studios ?? []).map((s) => ({
    url: `${siteUrl}/studios/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const playlistPages: MetadataRoute.Sitemap = (playlists ?? []).map((p) => ({
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
