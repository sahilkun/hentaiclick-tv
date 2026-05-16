import { safeJsonLd } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";
import { getGenres } from "@/lib/queries/episodes";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

const GENRES_TITLE = "Browse Hentai by Genre — All Categories";
const GENRES_DESCRIPTION =
  "Browse the full HentaiClick catalog by genre — vanilla, yuri, milf, big tits, ahegao, romance, fantasy, and dozens more. AI-uncensored hentai streaming in 4K, 1080p, and HD with English subtitles.";
const GENRES_OG_TITLE = "Browse Hentai by Genre | HentaiClick";
const GENRES_OG_DESCRIPTION =
  "Find your favorite hentai categories — vanilla, yuri, milf, big tits, ahegao, romance, fantasy, and more. Streaming and downloads in 4K, 1080p, and HD.";

export const metadata: Metadata = {
  title: GENRES_TITLE,
  description: GENRES_DESCRIPTION,
  openGraph: buildOpenGraph({
    title: GENRES_OG_TITLE,
    description: GENRES_OG_DESCRIPTION,
    url: "/genres",
  }),
  twitter: buildTwitter({
    title: GENRES_OG_TITLE,
    description: GENRES_OG_DESCRIPTION,
  }),
  alternates: { canonical: "/genres" },
};

export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const genres = await getGenres();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  // CollectionPage tells Google + AI engines this is an index of named
  // entities, not a content article. The ItemList enumerates every
  // genre by name + URL so AI agents fetching a single page can answer
  // "what genres does HentaiClick have?" without follow-up requests.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/genres#collectionpage`,
    name: "Browse Hentai by Genre",
    description:
      "Index of every genre in the HentaiClick catalog — AI-uncensored hentai streaming in 4K, 1080p, and HD.",
    url: `${siteUrl}/genres`,
    inLanguage: "en-US",
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: genres.length,
      itemListElement: genres.map((genre: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: genre.name,
        url: `${siteUrl}/genres/${genre.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        {/* H1 + intro paragraph. Was a bare "Genres" heading with no body
            copy — practically invisible to any "[genre] hentai" or
            "browse hentai by genre" query. Now keyword-loaded H1 + a
            short paragraph that names the most-searched genres in
            running prose so the page can pick up long-tail traffic
            without us writing a per-genre description column yet. */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Browse Hentai by Genre
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Find your favorite hentai categories on HentaiClick. The catalog
          covers every major genre — vanilla, yuri, milf, big tits, ahegao,
          romance, fantasy, schoolgirl, harem, NTR, and dozens more — plus
          tags for AI-uncensored and originally-uncensored episodes. Every
          release streams in 4K, 1080p, or HD with English subtitles, and
          most come with a downloadable 1080p or 4K MKV. Pick a genre below
          to jump straight to the full episode list, or use the{" "}
          <Link href="/search" className="text-primary hover:underline">
            search page
          </Link>{" "}
          to combine multiple filters at once.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {genres.map((genre: any) => (
            <Link
              key={genre.id}
              href={`/genres/${genre.slug}`}
              className="flex items-center justify-center rounded-lg border border-border bg-card p-6 text-center font-medium transition-colors hover:bg-accent hover:text-primary"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
