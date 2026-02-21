"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Download,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Upload,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VideoPlayer } from "@/components/player/video-player";
import { EpisodeList } from "@/components/episode/episode-list";
import { EpisodeCarousel } from "@/components/episode/episode-carousel";
import { DownloadModal } from "@/components/episode/download-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, getRatingColor, getRatingBgColor } from "@/lib/utils";
import { getStreamableQualities } from "@/lib/access";
import { deriveStreamQualities, deriveDownloadQualities } from "@/lib/cdn";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import type { EpisodeWithRelations, UserContext } from "@/types";

interface WatchPageClientProps {
  episode: EpisodeWithRelations;
  seriesEpisodes: EpisodeWithRelations[];
  popularWeekly: EpisodeWithRelations[];
}

export function WatchPageClient({
  episode,
  seriesEpisodes,
  popularWeekly,
}: WatchPageClientProps) {
  const { user } = useAuth();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const userContext: UserContext = {
    id: user?.id ?? null,
    role: user
      ? (user.role as "user" | "moderator" | "admin")
      : "guest",
    isPremium: user?.is_premium ?? false,
  };

  const streamQualities = deriveStreamQualities(episode.stream_links);
  const allowedQualities = getStreamableQualities(
    streamQualities,
    userContext,
    episode.upload_date
  );

  const handleView = useCallback(async () => {
    try {
      await fetch(`/api/episodes/${episode.id}/view`, { method: "POST" });
    } catch {}
  }, [episode.id]);

  const qualityBadge = streamQualities
    .sort((a, b) => b - a)
    .map((q) => QUALITY_LABELS[q] ?? `${q}p`)
    .join(" | ");

  // Genre color mapping
  const getGenreVariant = (slug: string) => {
    if (slug === "4k") return "success";
    if (slug === "censored") return "warning";
    if (["ntr", "rape"].includes(slug)) return "destructive";
    return "secondary";
  };

  return (
    <div>
      {/* Player */}
      <VideoPlayer
        streamLinks={episode.stream_links}
        subtitleLinks={episode.subtitle_links}
        thumbnailPath={episode.thumbnail_path}
        availableQualities={streamQualities}
        allowedQualities={allowedQualities}
        onView={handleView}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Episode Meta */}
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            {/* Poster + Title */}
            <div className="flex gap-4">
              {episode.poster_url && (
                <img
                  src={episode.poster_url}
                  alt={episode.title}
                  className="hidden h-32 w-24 rounded-lg object-cover sm:block"
                />
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold sm:text-2xl">
                  {episode.title}
                </h1>
                {episode.series && (
                  <Link
                    href={`/series/${episode.series.slug}`}
                    className="mt-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    {episode.series.title}
                  </Link>
                )}

                {/* Dates & Studio */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(episode.upload_date), {
                      addSuffix: true,
                    })}
                  </span>
                  {episode.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(episode.release_date).toLocaleDateString()}
                    </span>
                  )}
                  {episode.series?.studio && (
                    <Link
                      href={`/studios/${episode.series.studio.slug}`}
                      className="hover:text-primary"
                    >
                      {episode.series.studio.name}
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatNumber(episode.view_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {formatNumber(episode.like_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {formatNumber(episode.comment_count)}
                  </span>
                  {/* Rating badge */}
                  <span
                    className={cn(
                      "flex h-6 items-center rounded-full px-2 text-xs font-bold text-white",
                      episode.rating_count > 0
                        ? getRatingBgColor(episode.rating_avg)
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {episode.rating_count > 0
                      ? `${episode.rating_avg.toFixed(1)}/10`
                      : "N/A"}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDownloadOpen(true)}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 className="mr-1.5 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Description */}
            {episode.meta_description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-bold text-primary">
                  Description
                </h2>
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    !showFullDescription && "line-clamp-3"
                  )}
                >
                  {episode.meta_description}
                </p>
                {episode.meta_description.length > 200 && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-primary hover:underline"
                    onClick={() =>
                      setShowFullDescription(!showFullDescription)
                    }
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            {/* Genres */}
            {episode.genres && episode.genres.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-bold text-primary">
                  Genres
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {episode.genres.map((genre) => (
                    <Link key={genre.id} href={`/genres/${genre.slug}`}>
                      <Badge
                        variant={getGenreVariant(genre.slug) as any}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {genre.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {episode.gallery_urls && episode.gallery_urls.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-bold text-primary">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {episode.gallery_urls.slice(0, 8).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      className="aspect-video rounded-lg object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder for Rate / Favorite / Playlist buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled>
                Rate
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Heart className="mr-1.5 h-4 w-4" />
                Favorite
              </Button>
              <Button variant="outline" size="sm" disabled>
                Add to Playlist
              </Button>
            </div>

            {/* Comments placeholder */}
            <div className="mt-8">
              <h2 className="mb-4 text-sm font-bold text-primary">
                Comments ({episode.comment_count})
              </h2>
              <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                {user
                  ? "Comments coming soon..."
                  : "Log in to view and post comments"}
              </div>
            </div>
          </div>

          {/* Sidebar: Series Episodes */}
          {seriesEpisodes.length > 0 && (
            <div className="w-full lg:w-80">
              <h2 className="mb-3 text-sm font-bold">
                Episodes ({seriesEpisodes.length})
              </h2>
              <EpisodeList
                episodes={seriesEpisodes}
                currentEpisodeId={episode.id}
              />
            </div>
          )}
        </div>

        {/* More from Studio / Popular Weekly */}
        {popularWeekly.length > 0 && (
          <div className="mt-12">
            <EpisodeCarousel
              episodes={popularWeekly}
              title="Popular This Week"
            />
          </div>
        )}
      </div>

      {/* Download Modal */}
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        episode={episode}
        userContext={userContext}
      />
    </div>
  );
}
