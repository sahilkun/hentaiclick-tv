"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { EpisodeGrid, EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import type { EpisodeWithRelations } from "@/types";

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<any>(null);
  const [episodes, setEpisodes] = useState<EpisodeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      const supabase = createClient();

      const { data: playlistData } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      setPlaylist(playlistData);

      if (playlistData) {
        const { data: episodeData } = await supabase
          .from("playlist_episodes")
          .select(
            `
            position,
            episode:episode_id (
              *,
              series:series_id (title, slug, studio:studio_id (name, slug))
            )
          `
          )
          .eq("playlist_id", id)
          .order("position", { ascending: true });

        const eps =
          episodeData
            ?.map((pe: any) => pe.episode)
            .filter(Boolean) ?? [];
        setEpisodes(eps as unknown as EpisodeWithRelations[]);
      }

      setLoading(false);
    };

    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
        <EpisodeGridSkeleton count={8} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Playlist not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{playlist.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {playlist.episode_count} episodes ·{" "}
        {playlist.is_public ? "Public" : "Private"}
      </p>

      <EpisodeGrid episodes={episodes} />
    </div>
  );
}
