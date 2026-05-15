import { NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";

export async function GET() {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("genres")
      .select("id, name, slug, is_subgenre, parent_genre_id, episode_genres(count)")
      .order("name", { ascending: true });

    if (error) throw error;

    // Flatten the embedded count
    const result = (data ?? []).map(({ episode_genres, ...rest }: any) => ({
      ...rest,
      episode_count: episode_genres?.[0]?.count ?? 0,
    }));

    return NextResponse.json(result, {
      headers: {
        // Edge-cache for 60s, then SWR for 10 min. Was s-maxage=3600
        // (1 hour) which meant a deleted/renamed/recounted genre stayed
        // wrong in the search-page filter UI for up to an hour after
        // the change. 60s is plenty of cheap-query coalescing without
        // making content edits feel stuck.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}
