import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlaylistDetailClient } from "./playlist-detail-client";
import type { Metadata } from "next";
import type { EpisodeWithRelations } from "@/types";

interface PlaylistPageProps {
  params: Promise<{ slug: string }>;
}

async function getPlaylist(slug: string) {
  const supabase = await createClient();

  const { data: playlist } = await supabase
    .from("playlists")
    .select(
      "*, user:profiles!playlists_user_id_profiles_fk (username, display_name, avatar_url)"
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!playlist) return null;

  const { data: items } = await supabase
    .from("playlist_episodes")
    .select(
      `
      position,
      episode:episode_id (
        id, title, slug, thumbnail_url, poster_url, gallery_urls,
        stream_links, download_links, subtitle_links, thumbnail_path,
        view_count, like_count, comment_count, rating_avg, rating_count,
        views_7d, upload_date, release_date, duration_seconds, status,
        regional_name, meta_title, meta_description,
        series:series_id (title, slug),
        studio:studio_id (name, slug)
      )
    `
    )
    .eq("playlist_id", playlist.id)
    .order("position", { ascending: true });

  const episodes: EpisodeWithRelations[] =
    (items ?? [])
      .map((item: any) => item.episode)
      .filter(Boolean)
      .map((ep: any) => ({
        ...ep,
        season_no: 1,
        episode_no: 1,
        studio_id: null,
        series_id: null,
        description: ep.meta_description ?? "",
        created_at: ep.upload_date,
        updated_at: ep.upload_date,
      }));

  return { playlist, episodes };
}

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPlaylist(slug);

  if (!result) {
    return { title: "Playlist Not Found" };
  }

  const creatorName =
    result.playlist.user?.display_name ||
    result.playlist.user?.username ||
    "Unknown";

  const description = `Watch ${result.playlist.episode_count} episodes in the "${result.playlist.title}" playlist by ${creatorName}.`;

  return {
    title: `${result.playlist.title} - Playlist by ${creatorName}`,
    description,
    openGraph: {
      title: `${result.playlist.title} | HentaiClick TV`,
      description,
      url: `/playlists/${slug}`,
    },
    alternates: { canonical: `/playlists/${slug}` },
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { slug } = await params;
  const result = await getPlaylist(slug);

  if (!result) {
    notFound();
  }

  return (
    <PlaylistDetailClient
      playlist={result.playlist}
      episodes={result.episodes}
    />
  );
}
