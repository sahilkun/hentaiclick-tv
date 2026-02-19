import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration, formatNumber } from "@/lib/utils";
import { Eye } from "lucide-react";
import type { EpisodeWithRelations } from "@/types";

interface EpisodeListProps {
  episodes: EpisodeWithRelations[];
  currentEpisodeId?: string;
  className?: string;
}

export function EpisodeList({
  episodes,
  currentEpisodeId,
  className,
}: EpisodeListProps) {
  // Group episodes by season
  const grouped = episodes.reduce(
    (acc, ep) => {
      const season = ep.season_no;
      if (!acc[season]) acc[season] = [];
      acc[season].push(ep);
      return acc;
    },
    {} as Record<number, EpisodeWithRelations[]>
  );

  const seasons = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={cn("space-y-4", className)}>
      {seasons.map((season) => (
        <div key={season}>
          {seasons.length > 1 && (
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Season {season}
            </h3>
          )}
          <div className="space-y-2">
            {grouped[season].map((ep) => {
              const isCurrent = ep.id === currentEpisodeId;
              return (
                <Link
                  key={ep.id}
                  href={`/episode/${ep.slug}`}
                  className={cn(
                    "flex gap-3 rounded-lg border p-2 transition-colors",
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted">
                    {ep.thumbnail_url && (
                      <img
                        src={ep.thumbnail_url}
                        alt={ep.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {ep.duration_seconds > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] text-white">
                        {formatDuration(ep.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "line-clamp-1 text-sm font-medium",
                        isCurrent && "text-primary"
                      )}
                    >
                      Ep. {ep.episode_no} — {ep.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(ep.view_count)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
