import { cn } from "@/lib/utils";
import { EpisodeCard } from "./episode-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EpisodeWithRelations } from "@/types";

export type ViewMode = "thumbnail" | "poster";

interface EpisodeGridProps {
  episodes: EpisodeWithRelations[];
  className?: string;
  viewMode?: ViewMode;
  priorityCount?: number;
}

export function EpisodeGrid({ episodes, className, viewMode = "thumbnail", priorityCount = 0 }: EpisodeGridProps) {
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
        "grid gap-4",
        viewMode === "poster"
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {episodes.map((episode, i) => (
        <EpisodeCard key={episode.id} episode={episode} viewMode={viewMode} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function EpisodeGridSkeleton({
  count = 8,
  className,
  viewMode = "thumbnail",
}: {
  count?: number;
  className?: string;
  viewMode?: ViewMode;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        viewMode === "poster"
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <Skeleton className={viewMode === "poster" ? "aspect-[11/16] w-full" : "aspect-video w-full"} />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
