"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ListVideo, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PlaylistData {
  id: string;
  title: string;
  slug: string;
  is_public: boolean;
  episode_count: number;
  created_at: string;
  user: { username: string; display_name: string };
}

const SORT_OPTIONS = [
  { value: "episode_count", label: "Episode Count" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export default function PublicPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch("/api/playlists?public=true");
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data.playlists ?? []);
        }
      } catch {}
      setLoading(false);
    };

    fetchPlaylists();
  }, []);

  // Client-side filter/sort
  let filtered = playlists.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  filtered.sort((a, b) => {
    switch (sort) {
      case "episode_count":
        return b.episode_count - a.episode_count;
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "newest":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold">Public Playlists</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playlists..."
            className="pl-9"
          />
        </div>
        <CustomSelect
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          className="w-44"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No public playlists found.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.slug}`}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <ListVideo className="h-8 w-8 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium group-hover:text-primary">
                    {playlist.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    by {playlist.user?.display_name ?? "Unknown"} ·{" "}
                    {playlist.episode_count} episodes
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Play
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
