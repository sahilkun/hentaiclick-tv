"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ListVideo,
  Play,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EpisodeGrid, type ViewMode } from "@/components/episode/episode-grid";
import { cn, formatNumber } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { EpisodeWithRelations } from "@/types";

interface PlaylistDetailClientProps {
  playlist: {
    id: string;
    title: string;
    slug: string;
    episode_count: number;
    created_at: string;
    updated_at: string;
    user: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
  episodes: EpisodeWithRelations[];
}

export function PlaylistDetailClient({
  playlist,
  episodes,
}: PlaylistDetailClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("thumbnail");

  const creatorName =
    playlist.user?.display_name || playlist.user?.username || "Unknown";

  const firstEpisode = episodes[0];

  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      {/* Playlist header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Playlist icon / thumbnail */}
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
          {firstEpisode?.thumbnail_url ? (
            <img
              src={firstEpisode.thumbnail_url}
              alt={playlist.title}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <ListVideo className="h-12 w-12 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{playlist.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {creatorName}
            </span>
            <span>{playlist.episode_count} episodes</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created{" "}
              {formatDistanceToNow(new Date(playlist.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {firstEpisode && (
            <Link href={`/episode/${firstEpisode.slug}?playlist=${playlist.id}`}>
              <Button className="mt-4" size="sm">
                <Play className="mr-1.5 h-4 w-4" />
                Play All
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Episodes grid */}
      {episodes.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          This playlist has no episodes yet.
        </p>
      ) : (
        <EpisodeGrid episodes={episodes} viewMode={viewMode} />
      )}
    </div>
  );
}
