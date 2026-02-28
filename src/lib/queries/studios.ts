import { unstable_cache } from "next/cache";
import { getAnonClient } from "@/lib/supabase/anon";
import type { EpisodeWithRelations } from "@/types";

/* ─── Studio by slug (cached) ─── */

export interface StudioDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  [key: string]: unknown;
}

async function fetchStudioBySlug(slug: string): Promise<StudioDetail | null> {
  const supabase = getAnonClient();

  const { data, error } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch studio "${slug}": ${error.message}`);
  }
  if (!data) return null;
  return data as unknown as StudioDetail;
}

export async function getStudioBySlug(
  slug: string
): Promise<StudioDetail | null> {
  const cached = unstable_cache(
    () => fetchStudioBySlug(slug),
    ["studio", slug],
    { revalidate: 1800, tags: ["studios"] }
  );
  return cached();
}

/* ─── Studio episodes (cached) ─── */

async function fetchStudioEpisodes(
  studioId: string,
  limit: number
): Promise<EpisodeWithRelations[]> {
  const supabase = getAnonClient();

  // Get series by this studio
  const { data: seriesData } = await supabase
    .from("series")
    .select("id")
    .eq("studio_id", studioId);

  const seriesIds = seriesData?.map((s: any) => s.id) ?? [];
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

export async function getStudioEpisodes(
  studioId: string,
  limit: number = 50
): Promise<EpisodeWithRelations[]> {
  const cached = unstable_cache(
    () => fetchStudioEpisodes(studioId, limit),
    ["studio-episodes-page", studioId, String(limit)],
    { revalidate: 1800, tags: ["episodes"] }
  );
  return cached();
}
