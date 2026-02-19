import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-muted" />
      <EpisodeGridSkeleton count={12} />
    </div>
  );
}
