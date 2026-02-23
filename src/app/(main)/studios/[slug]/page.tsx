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
  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("slug", slug)
    .single();

  return { title: studio ? `${studio.name} Episodes` : "Studio Not Found" };
}

export default async function StudioDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!studio) notFound();

  // Get series by this studio
  const { data: seriesData } = await supabase
    .from("series")
    .select("id")
    .eq("studio_id", studio.id);

  const seriesIds = seriesData?.map((s) => s.id) ?? [];

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
    <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        {studio.logo_url && (
          <img
            src={studio.logo_url}
            alt={studio.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{studio.name}</h1>
          {studio.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {studio.description}
            </p>
          )}
        </div>
      </div>

      <EpisodeGrid episodes={episodes} />
    </div>
  );
}
