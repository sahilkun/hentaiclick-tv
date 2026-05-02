import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import {
  PrimaryEpisodeTabs,
  SecondaryEpisodeTabs,
  GenreCategoriesSection,
  LatestCommentsSection,
  ContinueWatchingSection,
} from "./home-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "AI-decensored hentai in 4K, 1080p, and HD — for free. Stream and download episodes with subtitles. New releases daily.",
  openGraph: {
    title: "AI-Decensored Hentai in 4K, 1080p, HD — HentaiClick",
    description:
      "AI-decensored hentai in 4K, 1080p, and HD — for free. Stream and download episodes with subtitles. New releases daily.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1424, height: 752 }],
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
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

      {/* Continue Watching — only renders for logged-in users with progress.
          Streamed in independently so it doesn't block the rest of the page. */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 pt-8">
        <Suspense fallback={null}>
          <ContinueWatchingSection />
        </Suspense>
      </section>

      {/* Primary Tabs — streams in first */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EpisodeGridSkeleton />}>
          <PrimaryEpisodeTabs />
        </Suspense>
      </section>

      {/* Secondary Tabs — streams independently */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EpisodeGridSkeleton />}>
          <SecondaryEpisodeTabs />
        </Suspense>
      </section>

      {/* Categories — streams independently */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Suspense fallback={null}>
          <GenreCategoriesSection />
        </Suspense>
      </section>

      {/* Latest Comments — streams last */}
      <section className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Suspense fallback={null}>
          <LatestCommentsSection />
        </Suspense>
      </section>
    </div>
  );
}
