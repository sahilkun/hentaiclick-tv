import { createClient } from "@/lib/supabase/server";
import { EpisodeForm } from "@/components/admin/episode-form";

export const dynamic = "force-dynamic";

export default async function NewEpisodePage() {
  const supabase = await createClient();
  const { data: series } = await supabase
    .from("series")
    .select("id, title")
    .order("title", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Create Episode</h1>
      <EpisodeForm series={series ?? []} />
    </div>
  );
}
