"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ListVideo } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";

interface PlaylistData {
  id: string;
  title: string;
  slug: string;
  is_public: boolean;
  episode_count: number;
  created_at: string;
}

export default function PlaylistsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/playlists?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), is_public: newPublic }),
      });

      if (res.ok) {
        toast("Playlist created", "success");
        setCreateOpen(false);
        setNewTitle("");
        setNewPublic(false);
        fetchPlaylists();
      } else {
        const data = await res.json();
        toast(data.error ?? "Failed to create playlist", "error");
      }
    } catch {
      toast("Failed to create playlist", "error");
    }

    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Playlists</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Playlist
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No playlists yet. Create one to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/profile/playlists/${playlist.id}`}
              className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-accent"
            >
              <ListVideo className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{playlist.title}</p>
                <p className="text-sm text-muted-foreground">
                  {playlist.episode_count} episodes ·{" "}
                  {playlist.is_public ? "Public" : "Private"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <ModalHeader>
          <ModalTitle>Create Playlist</ModalTitle>
          <ModalClose onClose={() => setCreateOpen(false)} />
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Playlist"
                maxLength={100}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={newPublic}
                onCheckedChange={setNewPublic}
                id="public-toggle"
              />
              <label htmlFor="public-toggle" className="text-sm">
                Make public
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
