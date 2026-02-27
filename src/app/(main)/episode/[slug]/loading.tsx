import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodeLoading() {
  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      {/* Video player skeleton */}
      <Skeleton className="aspect-video w-full rounded-lg" />

      {/* Title + meta */}
      <div className="mt-4 space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
