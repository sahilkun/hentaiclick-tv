"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Lock,
  Trash2,
  X,
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import { CircularRating } from "@/components/ui/circular-rating";
import { cn, formatNumber } from "@/lib/utils";
import { deriveStreamQualities } from "@/lib/cdn";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import type { EpisodeWithRelations } from "@/types";

function getQualityBadgeText(qualities: number[]): string {
  const parts: string[] = [];
  if (qualities.includes(2160)) parts.push("4K");
  if (qualities.includes(1080)) parts.push("FHD");
  else if (qualities.includes(720)) parts.push("HD");
  return parts.join(" | ");
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<any>(null);
  const [episodes, setEpisodes] = useState<EpisodeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

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

  const toggleVisibility = async () => {
    if (!playlist || togglingVisibility) return;
    setTogglingVisibility(true);

    const newPublic = !playlist.is_public;
    // Optimistic
    setPlaylist((p: any) => ({ ...p, is_public: newPublic }));

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: newPublic }),
      });

      if (!res.ok) {
        // Revert
        setPlaylist((p: any) => ({ ...p, is_public: !newPublic }));
        toast("Failed to update visibility", "error");
      } else {
        toast(newPublic ? "Playlist is now public" : "Playlist is now private", "success");
      }
    } catch {
      setPlaylist((p: any) => ({ ...p, is_public: !newPublic }));
      toast("Failed to update visibility", "error");
    }

    setTogglingVisibility(false);
  };

  const deletePlaylist = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Playlist deleted", "success");
        router.push("/profile/playlists");
      } else {
        toast("Failed to delete playlist", "error");
        setDeleting(false);
      }
    } catch {
      toast("Failed to delete playlist", "error");
      setDeleting(false);
    }
  };

  const removeEpisode = async (episodeId: string) => {
    // Optimistic
    setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));
    setPlaylist((p: any) =>
      p ? { ...p, episode_count: Math.max(0, (p.episode_count ?? 1) - 1) } : p
    );

    try {
      const res = await fetch("/api/playlists/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: id, episode_id: episodeId }),
      });

      if (!res.ok) {
        // Revert by refetching
        toast("Failed to remove episode", "error");
        fetchPlaylist();
      } else {
        toast("Episode removed", "success");
      }
    } catch {
      toast("Failed to remove episode", "error");
      fetchPlaylist();
    }
  };

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

  const isOwner = user?.id === playlist.user_id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/profile/playlists"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to playlists
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{playlist.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {playlist.episode_count} {playlist.episode_count === 1 ? "episode" : "episodes"}
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            {/* Public/Private toggle */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={toggleVisibility}
              disabled={togglingVisibility}
            >
              {playlist.is_public ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Private
                </>
              )}
            </Button>

            {/* Delete playlist */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Episodes grid with remove buttons */}
      {episodes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No episodes in this playlist yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {episodes.map((episode) => (
            <div key={episode.id} className="group/card relative">
              <Link
                href={`/episode/${episode.slug}`}
                className="block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {episode.thumbnail_url ? (
                    <img
                      src={episode.thumbnail_url}
                      alt={episode.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      No thumbnail
                    </div>
                  )}

                  {/* Rating badge */}
                  <CircularRating
                    rating={episode.rating_avg}
                    count={episode.rating_count}
                    size={38}
                    strokeWidth={3}
                    className="absolute left-2 top-2"
                  />

                  {/* Quality badge */}
                  {(() => {
                    const badge = getQualityBadgeText(
                      deriveStreamQualities(episode.stream_links)
                    );
                    return badge ? (
                      <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        {badge}
                      </div>
                    ) : null;
                  })()}

                  {/* Stats */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6">
                    <span className="flex items-center gap-1 text-xs text-white/90">
                      <Eye className="h-3.5 w-3.5" />
                      {formatNumber(episode.view_count)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/90">
                      <Heart className="h-3.5 w-3.5" />
                      {formatNumber(episode.like_count)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/90">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {formatNumber(episode.comment_count)}
                    </span>
                  </div>
                </div>

                {/* Text area */}
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight group-hover/card:text-primary">
                    {episode.title}
                  </h3>
                  {episode.series && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {episode.series.title}
                    </p>
                  )}
                </div>
              </Link>

              {/* Remove button (owner only) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => removeEpisode(episode.id)}
                  className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-lg transition-opacity group-hover/card:opacity-100"
                  title="Remove from playlist"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <ModalHeader>
          <ModalTitle>Delete Playlist</ModalTitle>
          <ModalClose onClose={() => setDeleteOpen(false)} />
        </ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete <strong>{playlist.title}</strong>?
            This will remove all episodes from the playlist. This action cannot
            be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={deletePlaylist}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
