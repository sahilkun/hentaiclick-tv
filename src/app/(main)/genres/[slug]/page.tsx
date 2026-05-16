import { safeJsonLd } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAnonClient } from "@/lib/supabase/anon";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getGenreBySlug, getGenreEpisodes } from "@/lib/queries/genres";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = getAnonClient();
  const { data } = await supabase.from("genres").select("slug");
  return (data ?? []).map((g: any) => ({ slug: g.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);

  if (!genre) return { title: "Genre Not Found" };

  // Keyword-loaded title pattern: "Yuri Hentai" beats "Yuri Hentai
  // Episodes" (latter is the old pattern, drowns the keyword in
  // boilerplate). Description follows the "watch/download X hentai
  // in 4K" template that matches the high-intent query shape.
  const title = `${genre.name} Hentai`;
  const description = `Watch ${genre.name} hentai online — AI-uncensored and originally-uncensored episodes streaming in 4K, 1080p, and HD with English subtitles. Most episodes available for 1080p or 4K MKV download.`;
  const ogTitle = `${title} | HentaiClick`;

  // Pick a representative episode poster as the social-share image so
  // each genre page has a distinct preview instead of falling back to
  // the site-wide /og-image.png. Fall back to the default when the
  // genre's first episode has no poster (rare — newly-inserted rows
  // that haven't had their CDN assets stitched yet).
  const firstEpisode = (await getGenreEpisodes(genre.id))[0];
  // poster_url is `string | null` in the row; coerce null -> undefined
  // so it threads into the optional-string OG helper without a type
  // widening hack.
  const ogImageUrl: string | undefined =
    firstEpisode?.poster_url ?? undefined;
  const ogImage = ogImageUrl
    ? {
        url: ogImageUrl,
        width: 1280,
        height: 720,
        alt: `${genre.name} hentai on HentaiClick`,
      }
    : undefined;

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title: ogTitle,
      description,
      url: `/genres/${slug}`,
      image: ogImage,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description,
      image: ogImageUrl,
    }),
    alternates: { canonical: `/genres/${slug}` },
  };
}

export default async function GenreDetailPage({ params }: Props) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);

  if (!genre) notFound();

  const episodes = await getGenreEpisodes(genre.id);
  const episodeCount = episodes.length;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const pageUrl = `${siteUrl}/genres/${slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Genres", item: `${siteUrl}/genres` },
      { "@type": "ListItem", position: 3, name: genre.name, item: pageUrl },
    ],
  };

  // CollectionPage + ItemList of the actual episode results. Caps at
  // 50 entries so the JSON-LD blob stays sane on popular genres that
  // can have hundreds of episodes — the visible grid still shows all.
  // The cap mirrors what Google's structured-data validators recommend
  // for ItemList; more than 50 dilutes the signal anyway.
  // dateModified is the strongest "fresh content" signal we can give
  // Google and AI engines for a listing page. Use the most recent
  // episode's upload_date — newest first because getGenreEpisodes
  // already sorts upload_date DESC — so the timestamp moves whenever
  // any episode in the genre is added or refreshed.
  const newestEpisode = episodes[0];
  const dateModified =
    newestEpisode?.updated_at || newestEpisode?.upload_date || undefined;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collectionpage`,
    url: pageUrl,
    name: `${genre.name} Hentai`,
    description: `Every ${genre.name} hentai episode in the HentaiClick catalog — AI-uncensored and originally-uncensored, streaming in 4K, 1080p, and HD with English subtitles.`,
    inLanguage: "en-US",
    isPartOf: { "@id": `${siteUrl}/#website` },
    ...(dateModified && { dateModified }),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: episodeCount,
      itemListElement: episodes
        .slice(0, 50)
        .map((ep: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}/episode/${ep.slug}`,
          name: ep.title,
        })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Genres", href: "/genres" },
          { label: genre.name },
        ]} />
        {/* Keyword-loaded H1 + count badge + intro. Old version was a
            bare 2xl heading of just genre.name with nothing else — page
            had zero body copy beyond the grid, so "[genre] hentai"
            queries never matched anywhere on the page outside the
            <title>. The intro is templated (no per-genre DB description
            column yet) but still hits the right keyword pattern and
            tells crawlers what the page is about. */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {genre.name} Hentai
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {episodeCount} {episodeCount === 1 ? "episode" : "episodes"}{" "}
            available
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Watch {genre.name.toLowerCase()} hentai online on HentaiClick — a
            mix of AI-uncensored and originally-uncensored episodes streaming
            in 4K, 1080p, and HD with English subtitles. New {genre.name.toLowerCase()}{" "}
            uploads are added regularly; most episodes also include a
            downloadable 1080p or 4K MKV. Scroll for the full list or sort
            with the controls below.
          </p>
        </div>
        <EpisodeGrid episodes={episodes} />
      </div>
    </>
  );
}
