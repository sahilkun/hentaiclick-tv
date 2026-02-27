import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
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
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}
