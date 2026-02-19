import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { EpisodeCarousel } from "@/components/episode/episode-carousel";
import { getEpisodes } from "@/lib/queries/episodes";
import type { EpisodeWithRelations } from "@/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: series } = await supabase
    .from("series")
    .select("title, meta_description")
    .eq("slug", slug)
    .single();

  return {
    title: series ? series.title : "Series Not Found",
    description: series?.meta_description,
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: series } = await supabase
    .from("series")
    .select(
      `*, studio:studio_id (name, slug)`
    )
    .eq("slug", slug)
    .single();

  if (!series) notFound();

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex gap-4">
            {series.cover_url && (
              <img
                src={series.cover_url}
                alt={series.title}
                className="hidden h-48 w-36 rounded-lg object-cover sm:block"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{series.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {series.year && <span>{series.year}</span>}
                <Badge variant="outline">{series.status}</Badge>
                {(series as any).studio && (
                  <Link
                    href={`/studios/${(series as any).studio.slug}`}
                    className="text-primary hover:underline"
                  >
                    {(series as any).studio.name}
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
                  <img
                    src={ep.thumbnail_url}
                    alt={ep.title}
                    className="h-14 w-24 shrink-0 rounded object-cover"
                  />
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
