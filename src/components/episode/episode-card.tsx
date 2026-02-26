"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, MessageCircle, TriangleAlert } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { CircularRating } from "@/components/ui/circular-rating";
import { deriveStreamQualities } from "@/lib/cdn";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import { WARNING_GENRES, genreColor } from "@/lib/genre-colors";
import type { EpisodeWithRelations } from "@/types";
import type { ViewMode } from "./episode-grid";

interface EpisodeCardProps {
  episode: EpisodeWithRelations;
  className?: string;
  viewMode?: ViewMode;
}

export function EpisodeCard({ episode, className, viewMode = "thumbnail" }: EpisodeCardProps) {
  const [hovering, setHovering] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const isPoster = viewMode === "poster";

  const hasGallery =
    episode.gallery_urls && episode.gallery_urls.length > 0;

  const startGallery = useCallback(() => {
    if (!hasGallery || isPoster) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHovering(true);
    setGalleryIndex(0);
    intervalRef.current = setInterval(() => {
      setGalleryIndex((prev) =>
        prev + 1 >= (episode.gallery_urls?.length ?? 0) ? 0 : prev + 1
      );
    }, 1500);
  }, [hasGallery, isPoster, episode.gallery_urls?.length]);

  const stopGallery = useCallback(() => {
    setHovering(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Build quality badge text (e.g. "4K | FHD")
  const qualityBadge = getQualityBadgeText(deriveStreamQualities(episode.stream_links));

  // Choose image source based on view mode
  const imageSrc = isPoster
    ? episode.poster_url || episode.thumbnail_url
    : hovering && hasGallery
      ? episode.gallery_urls[galleryIndex]
      : episode.thumbnail_url;

  return (
    <Link
      href={`/episode/${episode.slug}`}
      className={cn(
        "group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg",
        className
      )}
      onMouseEnter={startGallery}
      onMouseLeave={stopGallery}
    >
      {/* Image area */}
      <div className={cn(
        "relative overflow-hidden bg-muted",
        isPoster ? "aspect-[11/16]" : "aspect-video"
      )}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={episode.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No {isPoster ? "poster" : "thumbnail"}
          </div>
        )}

        {/* Rating badge (top-left) */}
        <CircularRating
          rating={episode.rating_avg}
          count={episode.rating_count}
          size={isPoster ? 32 : 38}
          strokeWidth={3}
          className="absolute left-2 top-2"
        />

        {/* Quality badge (top-right) */}
        {qualityBadge && (
          <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {qualityBadge}
          </div>
        )}

        {/* Stats overlay (bottom) */}
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

        {/* Gallery indicator dots (thumbnail mode only) */}
        {!isPoster && hovering && hasGallery && (
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1">
            {(episode.gallery_urls ?? []).slice(0, 8).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-1 rounded-full",
                  i === galleryIndex ? "bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary">
          {episode.title}
        </h3>
        {episode.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground">
            {episode.description}
          </p>
        )}
        {episode.genres && episode.genres.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {episode.genres.map((genre) => {
              const isWarning = WARNING_GENRES.has(genre.slug);
              return (
                <span
                  key={genre.slug}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider transition-colors",
                    genreColor(genre.slug)
                  )}
                >
                  {isWarning && <TriangleAlert className="h-3 w-3" />}
                  {genre.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}

function getQualityBadgeText(qualities: number[]): string {
  const parts: string[] = [];
  if (qualities.includes(2160)) parts.push("4K");
  if (qualities.includes(1080)) parts.push("FHD");
  else if (qualities.includes(720)) parts.push("HD");
  return parts.join(" | ");
}
