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

  const [{ data: episode }, { data: series }] = await Promise.all([
    supabase.from("episodes").select("*").eq("id", id).single(),
    supabase
      .from("series")
      .select("id, title")
      .order("title", { ascending: true }),
  ]);

  if (!episode) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Episode</h1>
      <EpisodeForm
        episode={episode as unknown as Episode}
        series={series ?? []}
      />
    </div>
  );
}
