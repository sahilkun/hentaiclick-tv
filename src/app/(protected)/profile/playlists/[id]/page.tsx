"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Lock,
  Trash2,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Play,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

interface PlaylistEpisode {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  series?: { title: string; slug: string } | null;
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
  const [episodes, setEpisodes] = useState<PlaylistEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null); // episode_id being moved

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
            id, title, slug, thumbnail_url,
            view_count, like_count, comment_count,
            series:series_id (title, slug)
          )
        `
        )
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      const eps =
        episodeData
          ?.map((pe: any) => pe.episode)
          .filter(Boolean) ?? [];
      setEpisodes(eps as PlaylistEpisode[]);
    }

    setLoading(false);
  };

  const toggleVisibility = async () => {
    if (!playlist || togglingVisibility) return;
    setTogglingVisibility(true);

    const newPublic = !playlist.is_public;
    setPlaylist((p: any) => ({ ...p, is_public: newPublic }));

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: newPublic }),
      });

      if (!res.ok) {
        setPlaylist((p: any) => ({ ...p, is_public: !newPublic }));
        toast("Failed to update visibility", "error");
      } else {
        toast(
          newPublic ? "Playlist is now public" : "Playlist is now private",
          "success"
        );
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

  const moveEpisode = async (
    episodeId: string,
    direction: "up" | "down"
  ) => {
    if (reordering) return;
    setReordering(episodeId);

    // Optimistic reorder
    setEpisodes((prev) => {
      const idx = prev.findIndex((ep) => ep.id === episodeId);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapIdx]] = [copy[swapIdx], copy[idx]];
      return copy;
    });

    try {
      const res = await fetch("/api/playlists/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: id, episode_id: episodeId, direction }),
      });

      if (!res.ok) {
        toast("Failed to reorder", "error");
        fetchPlaylist();
      }
    } catch {
      toast("Failed to reorder", "error");
      fetchPlaylist();
    }

    setReordering(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Playlist not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === playlist.user_id;
  const firstEpisode = episodes[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
            {episodes.length}{" "}
            {episodes.length === 1 ? "episode" : "episodes"}
            {" · "}
            {playlist.is_public ? "Public" : "Private"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Play button */}
          {firstEpisode && (
            <Link
              href={`/episode/${firstEpisode.slug}?playlist=${id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              Play
            </Link>
          )}

          {isOwner && (
            <>
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

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Episode list */}
      {episodes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No episodes in this playlist yet.
        </div>
      ) : (
        <div className="space-y-2">
          {episodes.map((episode, idx) => (
            <div
              key={episode.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
            >
              {/* Position number */}
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
                {idx + 1}
              </span>

              {/* Thumbnail */}
              <Link
                href={`/episode/${episode.slug}`}
                className="relative shrink-0 overflow-hidden rounded-md"
              >
                <div className="relative h-16 w-28 overflow-hidden bg-muted sm:h-20 sm:w-36">
                  {episode.thumbnail_url ? (
                    <img
                      src={episode.thumbnail_url}
                      alt={episode.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No thumb
                    </div>
                  )}
                  {/* Stats overlay */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3">
                    <span className="flex items-center gap-0.5 text-[10px] text-white/90">
                      <Eye className="h-2.5 w-2.5" />
                      {formatNumber(episode.view_count)}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-white/90">
                      <Heart className="h-2.5 w-2.5" />
                      {formatNumber(episode.like_count)}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-white/90">
                      <MessageCircle className="h-2.5 w-2.5" />
                      {formatNumber(episode.comment_count)}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Title + Series */}
              <Link
                href={`/episode/${episode.slug}`}
                className="flex-1 min-w-0"
              >
                <p className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {episode.title}
                </p>
                {episode.series && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {episode.series.title}
                  </p>
                )}
              </Link>

              {/* Reorder + Delete (owner only) */}
              {isOwner && (
                <div className="flex shrink-0 items-center gap-1">
                  {/* Move up */}
                  <button
                    type="button"
                    onClick={() => moveEpisode(episode.id, "up")}
                    disabled={idx === 0 || !!reordering}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      idx === 0
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  {/* Move down */}
                  <button
                    type="button"
                    onClick={() => moveEpisode(episode.id, "down")}
                    disabled={idx === episodes.length - 1 || !!reordering}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      idx === episodes.length - 1
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeEpisode(episode.id)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remove from playlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
