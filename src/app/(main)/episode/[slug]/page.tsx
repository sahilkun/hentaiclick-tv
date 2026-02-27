import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEpisodeBySlug, getEpisodesBySeries, getEpisodesByStudio, getEpisodes } from "@/lib/queries/episodes";
import { getAnonClient } from "@/lib/supabase/anon";
import { SITE_NAME } from "@/lib/constants";
import { WatchPageClient } from "./watch-page-client";

export async function generateStaticParams() {
  const supabase = getAnonClient();
  const { data } = await supabase
    .from("episodes")
    .select("slug")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(200);
  return (data ?? []).map((ep: any) => ({ slug: ep.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ playlist?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Episode Not Found" };

  const desc =
    episode.meta_description ??
    `Watch ${episode.title} in HD quality on ${SITE_NAME}.`;

  return {
    title: `${episode.title}${episode.series ? ` — ${episode.series.title}` : ""}`,
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

export default async function EpisodeWatchPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { playlist: playlistId } = await searchParams;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) notFound();

  // Resolve studio ID: direct on episode, or via series
  const resolvedStudioId = episode.studio_id
    ?? (episode.series as any)?.studio_id
    ?? null;

  const [seriesEpisodes, studioEpisodes, popularWeekly] = await Promise.all([
    episode.series_id
      ? getEpisodesBySeries(episode.series_id)
      : Promise.resolve([]),
    resolvedStudioId
      ? getEpisodesByStudio(resolvedStudioId, episode.id, 8)
      : Promise.resolve([]),
    getEpisodes("popular_weekly", 8),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <WatchPageClient
        episode={episode}
        seriesEpisodes={seriesEpisodes}
        studioEpisodes={studioEpisodes}
        popularWeekly={popularWeekly}
        playlistId={playlistId}
      />
    </>
  );
}
