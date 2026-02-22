"use client";

import { useState, useEffect, useRef } from "react";
import { ListPlus, Plus, Check, X, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";

interface PlaylistInfo {
  id: string;
  title: string;
  episode_count: number;
}

interface AddToPlaylistProps {
  episodeId: string;
  className?: string;
}

export function AddToPlaylist({ episodeId, className }: AddToPlaylistProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [contains, setContains] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewTitle("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists/items?episode_id=${episodeId}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists);
        setContains(new Set(data.contains));
      }
    } catch {}
    setLoading(false);
  };

  const handleOpen = () => {
    if (!user) {
      toast("Log in to manage playlists", "info");
      return;
    }
    setOpen(!open);
    if (!open) fetchPlaylists();
  };

  const togglePlaylist = async (playlistId: string) => {
    const isInPlaylist = contains.has(playlistId);
    // Optimistic update
    setContains((prev) => {
      const next = new Set(prev);
      if (isInPlaylist) next.delete(playlistId);
      else next.add(playlistId);
      return next;
    });

    try {
      const res = await fetch("/api/playlists/items", {
        method: isInPlaylist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: playlistId, episode_id: episodeId }),
      });

      if (!res.ok) {
        // Revert
        setContains((prev) => {
          const next = new Set(prev);
          if (isInPlaylist) next.add(playlistId);
          else next.delete(playlistId);
          return next;
        });
        toast("Failed to update playlist", "error");
      } else {
        toast(
          isInPlaylist ? "Removed from playlist" : "Added to playlist",
          "success"
        );
        // Update count locally
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId
              ? { ...p, episode_count: p.episode_count + (isInPlaylist ? -1 : 1) }
              : p
          )
        );
      }
    } catch {
      setContains((prev) => {
        const next = new Set(prev);
        if (isInPlaylist) next.add(playlistId);
        else next.delete(playlistId);
        return next;
      });
      toast("Failed to update playlist", "error");
    }
  };

  const createPlaylist = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), is_public: newPublic }),
      });
      if (res.ok) {
        const { playlist } = await res.json();
        setPlaylists((prev) => [playlist, ...prev]);
        setNewTitle("");
        setNewPublic(false);
        setCreating(false);
        toast("Playlist created", "success");
        // Auto-add episode to the new playlist
        await togglePlaylist(playlist.id);
      } else {
        const data = await res.json();
        toast(data.error || "Failed to create playlist", "error");
      }
    } catch {
      toast("Failed to create playlist", "error");
    }
  };

  const inAnyPlaylist = contains.size > 0;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
          inAnyPlaylist
            ? "border-primary bg-primary/10 text-primary"
            : "border-border hover:bg-accent"
        )}
      >
        <ListPlus className="h-3.5 w-3.5" />
        Playlist
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card shadow-xl">
          <div className="max-h-60 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                Loading...
              </p>
            ) : playlists.length === 0 && !creating ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No playlists yet
              </p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => togglePlaylist(playlist.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                      contains.has(playlist.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {contains.has(playlist.id) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  <span className="truncate">{playlist.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {playlist.episode_count}
                  </span>
                </button>
              ))
            )}

            {creating ? (
              <div className="mt-1 space-y-2 px-1">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createPlaylist();
                      if (e.key === "Escape") {
                        setCreating(false);
                        setNewTitle("");
                        setNewPublic(false);
                      }
                    }}
                    placeholder="Playlist name..."
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={createPlaylist}
                    disabled={!newTitle.trim()}
                    className="rounded-md p-1.5 text-primary hover:bg-accent disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNewTitle("");
                      setNewPublic(false);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPublic(!newPublic)}
                  className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {newPublic ? (
                    <Globe className="h-3 w-3 text-primary" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {newPublic ? "Public" : "Private"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create new playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
