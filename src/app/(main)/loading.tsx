import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-muted" />
      <EpisodeGridSkeleton count={12} />
    </div>
  );
}
