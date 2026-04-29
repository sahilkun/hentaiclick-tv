import Link from "next/link";
import { EpisodeCard } from "@/components/episode/episode-card";
import type { ContinueWatchingItem } from "@/lib/queries/watch-progress";

interface ContinueWatchingShelfProps {
  episodes: ContinueWatchingItem[];
}

/**
 * Homepage shelf showing in-progress episodes for the logged-in user.
 *
 * Renders nothing if the list is empty (which is also the case for
 * anonymous users — the server query returns []). Each card uses the
 * same EpisodeCard component as everywhere else, with the optional
 * `progressFraction` prop set so a thin progress bar renders at the
 * bottom of the thumbnail.
 */
export function ContinueWatchingShelf({ episodes }: ContinueWatchingShelfProps) {
  if (episodes.length === 0) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-lg font-bold">Continue Watching</h2>
        <Link
          href="/account/history"
          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          View all
        </Link>
      </div>
      {/* Reuse the same grid breakpoints as EpisodeGrid so spacing matches */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {episodes.map((ep, idx) => {
          const fraction =
            ep.duration_seconds > 0
              ? ep.position_seconds / ep.duration_seconds
              : 0;
          return (
            <EpisodeCard
              key={ep.id}
              episode={ep}
              priority={idx < 2}
              progressFraction={fraction}
            />
          );
        })}
      </div>
    </div>
  );
}
