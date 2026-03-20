"use client";

import { Suspense } from "react";
import SearchContent from "./search-content";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";

function SearchFallback() {
  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[90%] sm:px-6 lg:px-8 py-8">
      <div className="mb-6 h-10 rounded-md bg-muted animate-pulse" />
      <div className="mb-4 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-32 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
      <EpisodeGridSkeleton count={24} viewMode="thumbnail" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
