"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { cn, formatNumber } from "@/lib/utils";

interface PlaylistEpisodeItem {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  view_count: number;
}

interface PlaylistSidebarProps {
  playlistId: string;
  currentEpisodeId: string;
}

export function PlaylistSidebar({
  playlistId,
  currentEpisodeId,
}: PlaylistSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<any>(null);
  const [episodes, setEpisodes] = useState<PlaylistEpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    const supabase = createClient();

    const { data: playlistData } = await supabase
      .from("playlists")
      .select("*, user:profiles!playlists_user_id_profiles_fk (username, display_name)")
      .eq("id", playlistId)
      .single();

    setPlaylist(playlistData);

    if (playlistData) {
      const { data: episodeData } = await supabase
        .from("playlist_episodes")
        .select(
          `
          position,
          episode:episode_id (
            id, title, slug, thumbnail_url, view_count
          )
        `
        )
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      const eps =
        episodeData
          ?.map((pe: any) => pe.episode)
          .filter(Boolean) ?? [];
      setEpisodes(eps as PlaylistEpisodeItem[]);
    }

    setLoading(false);
  };

  const removeEpisode = async (episodeId: string) => {
    setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));

    try {
      const res = await fetch("/api/playlists/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: playlistId, episode_id: episodeId }),
      });

      if (!res.ok) {
        toast("Failed to remove", "error");
        await fetchPlaylist();
      }
    } catch {
      toast("Failed to remove", "error");
      await fetchPlaylist();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!playlist) return null;

  const isOwner = user?.id === playlist.user_id;
  const currentIdx = episodes.findIndex((ep) => ep.id === currentEpisodeId);
  const creatorName =
    playlist.user?.display_name || playlist.user?.username || "Unknown";

  return (
    <div>
      {/* Header */}
      <Link
        href={`/profile/playlists/${playlistId}`}
        className="text-sm font-bold text-primary hover:underline"
      >
        {playlist.title}
      </Link>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {creatorName} · {currentIdx >= 0 ? currentIdx + 1 : "?"}/{episodes.length}{" "}
        Episodes
      </p>

      {/* Episode list */}
      <div className="mt-3 space-y-1.5">
        {episodes.map((episode, idx) => {
          const isCurrent = episode.id === currentEpisodeId;

          return (
            <div
              key={episode.id}
              className={cn(
                "group/item flex items-center gap-2 rounded-md p-1.5 transition-colors",
                isCurrent
                  ? "bg-primary/15"
                  : "hover:bg-muted"
              )}
            >
              {/* Number or play icon */}
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
                {isCurrent ? (
                  <Play className="mx-auto h-3.5 w-3.5 fill-primary text-primary" />
                ) : (
                  idx + 1
                )}
              </span>

              {/* Thumbnail */}
              <Link
                href={`/episode/${episode.slug}?playlist=${playlistId}`}
                className="relative shrink-0 overflow-hidden rounded"
              >
                <div className="h-12 w-20 overflow-hidden bg-muted">
                  {episode.thumbnail_url ? (
                    <img
                      src={episode.thumbnail_url}
                      alt={episode.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      No thumb
                    </div>
                  )}
                </div>
              </Link>

              {/* Title + views */}
              <Link
                href={`/episode/${episode.slug}?playlist=${playlistId}`}
                className="flex-1 min-w-0"
              >
                <p
                  className={cn(
                    "text-xs font-medium leading-tight line-clamp-2 transition-colors",
                    isCurrent ? "text-primary" : "group-hover/item:text-primary"
                  )}
                >
                  {episode.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Eye className="h-2.5 w-2.5" />
                  {formatNumber(episode.view_count)} Views
                </p>
              </Link>

              {/* Delete button (owner only, on hover) */}
              {isOwner && !isCurrent && (
                <button
                  type="button"
                  onClick={() => removeEpisode(episode.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover/item:opacity-100"
                  title="Remove from playlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
