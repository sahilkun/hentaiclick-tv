import { Suspense } from "react";
import { safeJsonLd } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEpisodeBySlug, getEpisodesBySeries, getEpisodesByStudio, getEpisodes } from "@/lib/queries/episodes";
import { getAnonClient } from "@/lib/supabase/anon";
import { SITE_NAME, CDN_STREAM_BASE } from "@/lib/constants";
import { WatchPageClient } from "./watch-page-client";
import { getEpisodeProgress } from "@/lib/queries/watch-progress";

// `cookies()` access via the supabase server client (used to read the
// user's saved playback position) marks this route dynamic anyway, but
// we set it explicitly to make the intent clear.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Episode Not Found" };

  const desc =
    episode.meta_description ??
    `Watch ${episode.title} in HD quality on ${SITE_NAME}.`;

  return {
    title: episode.meta_title ?? `Watch ${episode.title}${episode.series ? ` (${episode.series.title})` : ""} in 4K HD`,
    description: desc,
    openGraph: {
      title: episode.title,
      description: desc,
      type: "video.episode",
      url: `/episode/${episode.slug}`,
      ...(episode.poster_url && {
        images: [{ url: episode.poster_url, width: 1280, height: 720 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description: desc,
      ...(episode.poster_url && { images: [episode.poster_url] }),
    },
    alternates: { canonical: `/episode/${episode.slug}` },
  };
}

function getVideoJsonLd(episode: NonNullable<Awaited<ReturnType<typeof getEpisodeBySlug>>>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const pageUrl = `${siteUrl}/episode/${episode.slug}`;

  // Build the public master playlist URL from stream_links + CDN base.
  // Google's video indexing strongly prefers `contentUrl` to be present —
  // it lets the crawler verify the video file exists and infer technical
  // metadata. Fall back gracefully if either piece is missing.
  const masterPath =
    (episode.stream_links as Record<string, string> | null | undefined)?.master;
  const contentUrl =
    masterPath && CDN_STREAM_BASE
      ? `${CDN_STREAM_BASE}/${masterPath
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
      : undefined;

  // Source audio is Japanese; subtitle_links keys are 2-letter language
  // codes for available subtitle tracks. Combine them for `inLanguage`.
  const subKeys = Object.keys(
    (episode.subtitle_links as Record<string, string> | null | undefined) ?? {}
  );
  const inLanguageList = Array.from(new Set(["ja", ...subKeys]));

  // Genre + keyword cloud. `keywords` is a comma-separated string per
  // schema.org spec; `genre` accepts an array.
  const genreNames = (episode.genres ?? [])
    .map((g: { name?: string }) => g?.name)
    .filter((n: string | undefined): n is string => Boolean(n));
  const keywordParts = [
    ...genreNames,
    episode.studio?.name,
    episode.series?.title,
  ].filter((s): s is string => Boolean(s));

  // Multiple thumbnails — Google picks the best aspect-ratio match.
  const thumbnails = [
    episode.poster_url,
    episode.thumbnail_url,
    ...(episode.gallery_urls ?? []),
  ].filter((u): u is string => Boolean(u));

  // Description must be non-empty for Video rich-result eligibility.
  const description =
    (episode.description?.trim() ||
      episode.meta_description ||
      `Watch ${episode.title} in HD quality on ${SITE_NAME}.`) as string;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: episode.title,
    description,
    thumbnailUrl: thumbnails.length > 1 ? thumbnails : thumbnails[0],
    uploadDate: episode.upload_date,
    ...(episode.duration_seconds && {
      duration: `PT${Math.floor(episode.duration_seconds / 60)}M${episode.duration_seconds % 60}S`,
    }),
    ...(contentUrl && { contentUrl }),
    embedUrl: pageUrl,
    url: pageUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage:
      inLanguageList.length === 1 ? inLanguageList[0] : inLanguageList,
    isFamilyFriendly: false,
    isAccessibleForFree: true,
    ...(genreNames.length > 0 && { genre: genreNames }),
    ...(keywordParts.length > 0 && { keywords: keywordParts.join(", ") }),
    ...(episode.series && {
      partOfSeries: {
        "@type": "TVSeries",
        name: episode.series.title,
        url: `${siteUrl}/series/${episode.series.slug}`,
      },
    }),
    ...(episode.episode_no && { episodeNumber: episode.episode_no }),
    ...(episode.season_no && { seasonNumber: episode.season_no }),
    ...(episode.rating_avg && episode.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: episode.rating_avg,
        bestRating: 10,
        ratingCount: episode.rating_count,
      },
    }),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: episode.view_count,
    },
    potentialAction: {
      "@type": "WatchAction",
      target: pageUrl,
    },
  };
}

export default async function EpisodeWatchPage({ params }: Props) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) notFound();

  // Resolve studio ID: direct on episode, or via series
  const resolvedStudioId = episode.studio_id
    ?? (episode.series as any)?.studio_id
    ?? null;

  const [seriesEpisodes, studioEpisodes, popularWeekly, initialPosition] =
    await Promise.all([
      episode.series_id
        ? getEpisodesBySeries(episode.series_id)
        : Promise.resolve([]),
      resolvedStudioId
        ? getEpisodesByStudio(resolvedStudioId, episode.id, 8)
        : Promise.resolve([]),
      getEpisodes("popular_weekly", 8),
      // Returns 0 for anonymous users or when no row exists. The player
      // ignores 0, so it's safe to always pass.
      getEpisodeProgress(episode.id).catch(() => 0),
    ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const jsonLd = getVideoJsonLd(episode);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(episode.series
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: episode.series.title,
              item: `${siteUrl}/series/${episode.series.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: episode.title,
              item: `${siteUrl}/episode/${episode.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: episode.title,
              item: `${siteUrl}/episode/${episode.slug}`,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <h1 className="sr-only">
        {`${episode.title}${episode.series ? ` (${episode.series.title})` : ""} - Watch in 4K HD on ${SITE_NAME}`}
      </h1>
      <Suspense fallback={null}>
        <WatchPageClient
          episode={episode}
          seriesEpisodes={seriesEpisodes}
          studioEpisodes={studioEpisodes}
          popularWeekly={popularWeekly}
          initialPosition={initialPosition || undefined}
        />
      </Suspense>
    </>
  );
}
