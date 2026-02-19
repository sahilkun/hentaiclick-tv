import { Suspense } from "react";
import Link from "next/link";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getEpisodes, getGenres } from "@/lib/queries/episodes";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import { HomeTabs } from "./home-tabs";

export const revalidate = 60;

export default async function HomePage() {
  const [
    recentlyUploaded,
    recentlyReleased,
    trending,
    mostViews,
    mostLikes,
    popularWeekly,
    genres,
  ] = await Promise.all([
    getEpisodes("recently_uploaded", 12),
    getEpisodes("recently_released", 12),
    getEpisodes("trending", 12),
    getEpisodes("most_views", 12),
    getEpisodes("most_likes", 12),
    getEpisodes("popular_weekly", 12),
    getGenres(),
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
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<EpisodeGridSkeleton />}>
          <HomeTabs
            primarySections={{
              "Recently Uploaded": recentlyUploaded,
              "Recently Released": recentlyReleased,
              Trending: trending,
            }}
            secondarySections={{
              "Most Views": mostViews,
              "Most Likes": mostLikes,
              "Popular Weekly": popularWeekly,
            }}
          />
        </Suspense>
      </section>

      {/* Categories */}
      {genres.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="mb-4 text-xl font-bold">Categories</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: "none" }}
          >
            {genres.slice(0, 12).map((genre) => (
              <Link
                key={genre.id}
                href={`/genres/${genre.slug}`}
                className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-card px-6 py-4 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">{genre.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
