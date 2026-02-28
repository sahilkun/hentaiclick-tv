import { NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";

export async function GET() {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("studios")
      .select("id, name, slug, episodes(count)")
      .order("name", { ascending: true });

    if (error) throw error;

    // Flatten the embedded count
    const result = (data ?? []).map(({ episodes, ...rest }: any) => ({
      ...rest,
      episode_count: episodes?.[0]?.count ?? 0,
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
