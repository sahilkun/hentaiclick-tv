import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import { EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import {
  PrimaryEpisodeTabs,
  SecondaryEpisodeTabs,
  GenreCategoriesSection,
  LatestCommentsSection,
  ContinueWatchingSection,
} from "./home-sections";

export const dynamic = "force-dynamic";

const HOMEPAGE_TITLE = "Watch AI Uncensored Hentai in 4K HD — HentaiClick";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  openGraph: buildOpenGraph({
    title: HOMEPAGE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  }),
  twitter: buildTwitter({
    title: HOMEPAGE_TITLE,
    description: SITE_DESCRIPTION,
  }),
  alternates: { canonical: "/" },
};

// NOTE: The previous version of this file emitted a second WebSite +
// Organization JSON-LD graph here. That duplicated the site-graph the
// root layout already injects on every page, and the @ids didn't even
// match (homepage used `siteUrl#website`, layout uses `siteUrl/#website`),
// so Google saw two parallel WebSite entities. The site graph now lives
// only in `src/app/layout.tsx::SiteGraphJsonLd`. Don't re-add it here.

export default function HomePage() {
  return (
    <div>
      {/* Hero Banner — H1 is the single most heavily weighted heading on
          the most-crawled page. Keep the brand name visually prominent via
          the inline span, but the actual H1 text must include the target
          keywords ("watch", "uncensored", "hentai", "4K") so Google can
          match the homepage to user queries like "watch uncensored hentai
          in 4k". Earlier version was just the brand name — wasted slot. */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Watch AI Uncensored Hentai in 4K HD on{" "}
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

      {/* SEO long-form copy. Lives at the bottom so it doesn't push
          dynamic content below the fold, but Google indexes the full
          page body so it still counts toward keyword relevance. Hits
          the six query patterns the site needs to rank for:
            watch / stream / download   ×   hentai / uncensored hentai */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">
        <div className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Watch and Download AI Uncensored Hentai in 4K HD
            </h2>
            <p>
              HentaiClick is a home for AI-uncensored hentai in 4K, 1080p,
              and HD. Watch the latest episodes online for free with English
              subtitles, or download the full uncensored MKV for offline
              viewing. Every release has the mosaic censorship removed via
              our in-house AI decensoring pipeline, so you see the original
              animation the studios actually drew.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Stream hentai online in 4K
            </h3>
            <p>
              Every episode streams adaptive-bitrate HLS — pick 720p, 1080p,
              or 4K (2160p) on the fly with no buffering. Subtitles are baked
              into the HLS playlist and switch on with one click. New
              uncensored episodes are added regularly; bookmark the homepage
              or follow the latest releases below.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Download uncensored hentai in 1080p or 4K
            </h3>
            <p>
              Hit the Download button on any episode to grab the full
              AI-uncensored MKV in 1080p or 4K. Downloads use one-time
              signed URLs and stream directly to your browser — no waiting,
              no ads, no shady redirects. Free users get five downloads per
              day; premium users get unlimited downloads at full speed.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Why AI uncensored?
            </h3>
            <p>
              Japanese hentai releases ship with mosaic censorship by law.
              We run every episode through a video2x + Real-CUGAN pipeline
              that reconstructs the censored regions frame by frame, then
              stitches the decensored scenes back into the original episode
              at 1080p and 4K. The result is the closest thing to the
              uncensored animation that exists, with picture quality that
              matches the source.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
