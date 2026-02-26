import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { EpisodeCarousel } from "@/components/episode/episode-carousel";
import { getEpisodes } from "@/lib/queries/episodes";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { EpisodeWithRelations } from "@/types";

interface StudioRef {
  name: string;
  slug: string;
}

interface SeriesWithStudio {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  cover_url?: string | null;
  year?: number | null;
  status: string;
  studio?: StudioRef | null;
  [key: string]: unknown;
}

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: series } = await supabase
    .from("series")
    .select("title, meta_description, cover_url")
    .eq("slug", slug)
    .single();

  if (!series) return { title: "Series Not Found" };

  const description =
    series.meta_description ||
    `Watch all episodes of ${series.title} in HD quality. Stream for free on HentaiClick TV.`;

  return {
    title: series.title,
    description,
    openGraph: {
      title: `${series.title} | HentaiClick TV`,
      description,
      url: `/series/${slug}`,
      ...(series.cover_url && {
        images: [{ url: series.cover_url, width: 300, height: 430 }],
      }),
    },
    alternates: { canonical: `/series/${slug}` },
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: rawSeries } = await supabase
    .from("series")
    .select(
      `*, studio:studio_id (name, slug)`
    )
    .eq("slug", slug)
    .single();

  if (!rawSeries) notFound();

  const series = rawSeries as unknown as SeriesWithStudio;

  // Fetch genres
  const { data: genreData } = await supabase
    .from("series_genres")
    .select("genre:genre_id (id, name, slug)")
    .eq("series_id", series.id);

  const genres =
    genreData?.map((g: any) => g.genre).filter(Boolean) ?? [];

  // Fetch episodes
  const { data: episodesData } = await supabase
    .from("episodes")
    .select(
      `*, series:series_id (title, slug, studio:studio_id (name, slug))`
    )
    .eq("series_id", series.id)
    .eq("status", "published")
    .order("season_no", { ascending: true })
    .order("episode_no", { ascending: true });

  const episodes = (episodesData ?? []) as unknown as EpisodeWithRelations[];

  // Popular weekly for sidebar
  const popularWeekly = await getEpisodes("popular_weekly", 6);

  // Group by season
  const seasons = episodes.reduce(
    (acc, ep) => {
      if (!acc[ep.season_no]) acc[ep.season_no] = [];
      acc[ep.season_no].push(ep);
      return acc;
    },
    {} as Record<number, EpisodeWithRelations[]>
  );

  return (
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        ...(series.studio ? [{ label: series.studio.name, href: `/studios/${series.studio.slug}` }] : []),
        { label: series.title },
      ]} />
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex gap-4">
            {series.cover_url && (
              <div className="relative hidden h-48 w-36 shrink-0 overflow-hidden rounded-lg sm:block">
                <Image
                  src={series.cover_url}
                  alt={series.title}
                  fill
                  sizes="144px"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{series.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {series.year && <span>{series.year}</span>}
                <Badge variant="outline">{series.status}</Badge>
                {series.studio && (
                  <Link
                    href={`/studios/${series.studio.slug}`}
                    className="text-primary hover:underline"
                  >
                    {series.studio.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {series.description && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-bold text-primary">
                Description
              </h2>
              <p className="text-sm text-muted-foreground">
                {series.description}
              </p>
            </div>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-bold text-primary">
                Genres
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((genre: any) => (
                  <Link key={genre.id} href={`/genres/${genre.slug}`}>
                    <Badge variant="secondary">{genre.name}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Episodes grouped by season */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold">
              Episodes ({episodes.length})
            </h2>
            {Object.entries(seasons)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([season, eps]) => (
                <div key={season} className="mb-6">
                  {Object.keys(seasons).length > 1 && (
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                      Season {season}
                    </h3>
                  )}
                  <EpisodeGrid episodes={eps} />
                </div>
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden w-72 lg:block">
          <h3 className="mb-3 text-sm font-bold">Popular This Week</h3>
          <div className="space-y-3">
            {popularWeekly.map((ep) => (
              <Link
                key={ep.id}
                href={`/episode/${ep.slug}`}
                className="flex gap-2 rounded-lg border border-border p-2 transition-colors hover:bg-accent"
              >
                {ep.thumbnail_url && (
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded">
                    <Image
                      src={ep.thumbnail_url}
                      alt={ep.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="line-clamp-2 text-xs font-medium">
                  {ep.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
