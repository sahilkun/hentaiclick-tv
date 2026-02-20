import { createClient } from "@/lib/supabase/server";
import { EpisodeForm } from "@/components/admin/episode-form";

export const dynamic = "force-dynamic";

export default async function NewEpisodePage() {
  const supabase = await createClient();
  const [{ data: series }, { data: genres }, { data: studios }] =
    await Promise.all([
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
    ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Create Episode</h1>
      <EpisodeForm
        series={series ?? []}
        genres={genres ?? []}
        studios={studios ?? []}
      />
    </div>
  );
}
