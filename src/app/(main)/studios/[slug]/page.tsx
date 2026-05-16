import { safeJsonLd } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAnonClient } from "@/lib/supabase/anon";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getStudioBySlug, getStudioEpisodes } from "@/lib/queries/studios";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = getAnonClient();
  const { data } = await supabase.from("studios").select("slug");
  return (data ?? []).map((s: any) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);

  if (!studio) return { title: "Studio Not Found" };

  const title = `${studio.name} Hentai Episodes`;
  const description =
    studio.description ||
    `Watch every hentai episode by ${studio.name} on HentaiClick — AI-uncensored and originally-uncensored releases streaming in 4K, 1080p, and HD with English subtitles. 1080p / 4K MKV downloads available.`;
  const ogTitle = `${title} | HentaiClick`;

  // Prefer studio.logo_url (square brand mark) → first episode poster
  // (16:9 thumbnail) → site default. Studio logos are usually square
  // 256x256 which is fine for Twitter `summary_large_image` (they get
  // letterboxed but readable). Episode posters are 1280x720 which is
  // ideal but per-studio variety on shares is less interesting than
  // the brand mark, so logo wins when available.
  const firstEpisode = (await getStudioEpisodes(studio.id))[0];
  const ogImageUrl: string | undefined =
    studio.logo_url || firstEpisode?.poster_url || undefined;
  const ogImage = ogImageUrl
    ? {
        url: ogImageUrl,
        ...(studio.logo_url
          ? { width: 256, height: 256 }
          : { width: 1280, height: 720 }),
        alt: `${studio.name} on HentaiClick`,
      }
    : undefined;

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title: ogTitle,
      description,
      url: `/studios/${slug}`,
      image: ogImage,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description,
      image: ogImageUrl,
    }),
    alternates: { canonical: `/studios/${slug}` },
  };
}

export default async function StudioDetailPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);

  if (!studio) notFound();

  const episodes = await getStudioEpisodes(studio.id);
  const episodeCount = episodes.length;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const pageUrl = `${siteUrl}/studios/${slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Studios", item: `${siteUrl}/studios` },
      { "@type": "ListItem", position: 3, name: studio.name, item: pageUrl },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collectionpage`,
    url: pageUrl,
    name: `${studio.name} Hentai Episodes`,
    description:
      studio.description ||
      `Every hentai episode by ${studio.name} in the HentaiClick catalog — AI-uncensored and originally-uncensored, streaming in 4K, 1080p, and HD.`,
    inLanguage: "en-US",
    isPartOf: { "@id": `${siteUrl}/#website` },
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

  // Fall back to a templated intro paragraph when the studio row has
  // no DB description. Keeps the page from being a thin header + grid
  // for the dozens of studios we haven't written bespoke copy for yet.
  const fallbackIntro = `Watch every hentai episode by ${studio.name} on HentaiClick — AI-uncensored and originally-uncensored releases streaming in 4K, 1080p, and HD with English subtitles. ${episodeCount} ${
    episodeCount === 1 ? "episode" : "episodes"
  } currently in the ${studio.name} catalog, with new uploads added regularly. Most episodes also offer a downloadable 1080p or 4K MKV.`;

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
          { label: "Studios", href: "/studios" },
          { label: studio.name },
        ]} />
        <div className="mb-6 flex items-start gap-4">
          {studio.logo_url && (
            <Image
              src={studio.logo_url}
              alt={studio.name}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {studio.name} Hentai Episodes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {episodeCount} {episodeCount === 1 ? "episode" : "episodes"}{" "}
              available
            </p>
          </div>
        </div>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {studio.description || fallbackIntro}
        </p>

        <EpisodeGrid episodes={episodes} />
      </div>
    </>
  );
}
