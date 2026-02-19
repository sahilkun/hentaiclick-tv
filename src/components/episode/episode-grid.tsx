import { cn } from "@/lib/utils";
import { EpisodeCard } from "./episode-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EpisodeWithRelations } from "@/types";

interface EpisodeGridProps {
  episodes: EpisodeWithRelations[];
  className?: string;
}

export function EpisodeGrid({ episodes, className }: EpisodeGridProps) {
  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No episodes found.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {episodes.map((episode) => (
        <EpisodeCard key={episode.id} episode={episode} />
      ))}
    </div>
  );
}

export function EpisodeGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
