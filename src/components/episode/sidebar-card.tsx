import Link from "next/link";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { deriveStreamQualities } from "@/lib/cdn";
import { QUALITY_LABELS, type Quality } from "@/lib/constants";
import type { EpisodeWithRelations } from "@/types";

interface SidebarCardProps {
  episode: EpisodeWithRelations;
  isCurrent?: boolean;
}

export function SidebarCard({ episode, isCurrent }: SidebarCardProps) {
  const qualities = deriveStreamQualities(episode.stream_links);
  const qualityBadge = qualities
    .sort((a, b) => b - a)
    .map((q) => QUALITY_LABELS[q] ?? `${q}p`)
    .join(" | ");

  return (
    <Link
      href={`/episode/${episode.slug}`}
      className={cn(
        "group/card relative block overflow-hidden rounded-lg",
        isCurrent && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs">
            No thumbnail
          </div>
        )}

        {/* Quality badge */}
        {qualityBadge && (
          <span className="absolute right-1.5 top-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {qualityBadge}
          </span>
        )}

        {/* Stats overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4">
          <div className="flex items-center gap-2.5 text-[11px] text-white/90">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {formatNumber(episode.view_count)}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" />
              {formatNumber(episode.like_count)}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              {formatNumber(episode.comment_count)}
            </span>
          </div>
        </div>

        {/* Current indicator */}
        {isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
              Now Playing
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="mt-1.5 line-clamp-1 px-0.5 text-sm font-medium text-foreground group-hover/card:text-primary transition-colors">
        {episode.title}
      </p>
    </Link>
  );
}
