import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EpisodeForm } from "@/components/admin/episode-form";
import type { Episode } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEpisodePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: episode },
    { data: series },
    { data: genres },
    { data: studios },
    { data: episodeGenres },
  ] = await Promise.all([
    supabase.from("episodes").select("*").eq("id", id).single(),
    supabase
      .from("series")
      .select("id, title")
      .order("title", { ascending: true }),
    supabase
      .from("genres")
      .select("id, name, slug, is_subgenre, parent_genre_id")
      .order("name", { ascending: true }),
    supabase
      .from("studios")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("episode_genres")
      .select("genre_id")
      .eq("episode_id", id),
  ]);

  if (!episode) notFound();

  const initialGenreIds =
    episodeGenres?.map((eg) => eg.genre_id) ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Episode</h1>
      <EpisodeForm
        episode={episode as unknown as Episode}
        series={series ?? []}
        genres={genres ?? []}
        studios={studios ?? []}
        initialGenreIds={initialGenreIds}
        initialStudioId={episode.studio_id}
      />
    </div>
  );
}
