import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEpisodeBySlug, getEpisodesBySeries, getEpisodes } from "@/lib/queries/episodes";
import { SITE_NAME } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { WatchPageClient } from "./watch-page-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Episode Not Found" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";

  return {
    title: `${episode.title}${episode.series ? ` — ${episode.series.title}` : ""}`,
    description:
      episode.meta_description ??
      `Watch ${episode.title} in HD quality on ${SITE_NAME}.`,
    openGraph: {
      title: episode.title,
      description:
        episode.meta_description ??
        `Watch ${episode.title} in HD quality on ${SITE_NAME}.`,
      type: "video.episode",
      url: `${siteUrl}/episode/${episode.slug}`,
      ...(episode.poster_url && {
        images: [{ url: episode.poster_url, width: 1280, height: 720 }],
      }),
    },
  };
}

function getVideoJsonLd(episode: NonNullable<Awaited<ReturnType<typeof getEpisodeBySlug>>>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: episode.title,
    description:
      episode.meta_description ??
      `Watch ${episode.title} in HD quality on ${SITE_NAME}.`,
    thumbnailUrl: episode.poster_url || episode.thumbnail_url,
    uploadDate: episode.upload_date,
    ...(episode.duration_seconds && {
      duration: `PT${Math.floor(episode.duration_seconds / 60)}M${episode.duration_seconds % 60}S`,
    }),
    ...(episode.rating_avg && {
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
    url: `${siteUrl}/episode/${episode.slug}`,
  };
}

export default async function EpisodeWatchPage({ params }: Props) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) notFound();

  const [seriesEpisodes, popularWeekly] = await Promise.all([
    episode.series_id
      ? getEpisodesBySeries(episode.series_id)
      : Promise.resolve([]),
    getEpisodes("popular_weekly", 6),
  ]);

  const jsonLd = getVideoJsonLd(episode);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WatchPageClient
        episode={episode}
        seriesEpisodes={seriesEpisodes}
        popularWeekly={popularWeekly}
      />
    </>
  );
}
