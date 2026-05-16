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
    <>
      {/* Visible H1 + intro paragraph. Lives outside the Suspense boundary
          so it is part of the initial SSR HTML payload — crawlers (Google,
          GPTBot, ClaudeBot, PerplexityBot) see real content + a single H1
          instead of an empty skeleton. Pre-fix the page shipped with 0
          headings, 0 images, ~43 words of body copy in the SSR snapshot,
          which made it almost invisible to keyword-matching on the
          "browse / catalog / uncensored hentai" query family. */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[90%] px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Browse Uncensored Hentai Episodes
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Search and filter the full HentaiClick catalog of AI-uncensored and
          truly-uncensored hentai. Every episode streams in 4K, 1080p, or HD
          with English subtitles, and most releases include a downloadable
          1080p/4K MKV. Filter by genre, studio, or series to narrow the list,
          sort by latest upload or popularity, and switch between thumbnail
          and detailed views. New uncensored episodes are added regularly —
          if you can&apos;t find what you&apos;re looking for today, check
          back tomorrow.
        </p>
      </section>
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </>
  );
}
