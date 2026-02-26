import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import {
  getEpisodes,
  getGenresWithPosters,
  getLatestComments,
} from "@/lib/queries/episodes";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import { GenreCategories } from "@/components/genre/genre-categories";
import { LatestComments } from "@/components/comments/latest-comments";
import { HomeTabs } from "./home-tabs";

export const revalidate = 60;

export const metadata: Metadata = {
  description:
    "Watch the highest quality hentai in 4K, 1080p, and HD for free. Stream and download episodes with subtitles. New releases added daily.",
  openGraph: {
    title: "HentaiClick TV - Watch Hentai in 4K, 1080p, HD Free",
    description:
      "Stream and download the best hentai in 4K, 1080p, and HD. New episodes added daily.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [
    recentlyUploaded,
    recentlyReleased,
    topViewedWeekly,
    mostViews,
    mostLikes,
    highestRated,
    genresWithPosters,
    latestComments,
  ] = await Promise.all([
    getEpisodes("recently_uploaded", 12).catch(() => []),
    getEpisodes("recently_released", 12).catch(() => []),
    getEpisodes("trending", 12).catch(() => []),
    getEpisodes("most_views", 12).catch(() => []),
    getEpisodes("most_likes", 12).catch(() => []),
    getEpisodes("highest_rated", 12).catch(() => []),
    getGenresWithPosters().catch(() => []),
    getLatestComments(10).catch(() => []),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-primary">{SITE_NAME}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {SITE_DESCRIPTION}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse Episodes
            </Link>
            <Link
              href="/genres"
              className="inline-flex h-11 items-center rounded-md border border-border px-8 text-sm font-medium hover:bg-accent"
            >
              Explore Genres
            </Link>
          </div>
        </div>
      </section>

      {/* Tabbed Episode Sections */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EpisodeGridSkeleton />}>
          <HomeTabs
            primarySections={{
              "Recently Uploaded": recentlyUploaded,
              "Recently Released": recentlyReleased,
              "Top Viewed This Week": topViewedWeekly,
            }}
            secondarySections={{
              "Most Views": mostViews,
              "Most Favorited": mostLikes,
              "Highest Rated - Weekly": highestRated,
            }}
          />
        </Suspense>
      </section>

      {/* Categories – stacked poster cards */}
      {genresWithPosters.length > 0 && (
        <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
          <GenreCategories genres={genresWithPosters} />
        </section>
      )}

      {/* Latest Comments */}
      {latestComments.length > 0 && (
        <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
          <LatestComments comments={latestComments} />
        </section>
      )}
    </div>
  );
}
