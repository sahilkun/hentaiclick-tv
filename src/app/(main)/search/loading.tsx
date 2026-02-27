import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mb-6 flex gap-2">
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
      <EpisodeGridSkeleton count={12} />
    </div>
  );
}
