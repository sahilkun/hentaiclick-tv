import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import type { EpisodeWithRelations } from "@/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: genre } = await supabase
    .from("genres")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: genre ? `${genre.name} Hentai` : "Genre Not Found",
  };
}

export default async function GenreDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: genre } = await supabase
    .from("genres")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!genre) notFound();

  // Get series that have this genre
  const { data: seriesGenres } = await supabase
    .from("series_genres")
    .select("series_id")
    .eq("genre_id", genre.id);

  const seriesIds = seriesGenres?.map((sg) => sg.series_id) ?? [];

  let episodes: EpisodeWithRelations[] = [];
  if (seriesIds.length > 0) {
    const { data } = await supabase
      .from("episodes")
      .select(
        `*, series:series_id (title, slug, studio:studio_id (name, slug))`
      )
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("upload_date", { ascending: false })
      .limit(50);

    episodes = (data ?? []) as unknown as EpisodeWithRelations[];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{genre.name}</h1>
      <EpisodeGrid episodes={episodes} />
    </div>
  );
}
