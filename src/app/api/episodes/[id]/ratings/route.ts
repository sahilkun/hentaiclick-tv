import { NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const supabase = getAnonClient();

  // Parallel head-only count queries — transfers zero rows.
  // Each query only returns a count for a specific score (1-10).
  const counts = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i + 1).map(async (score) => {
      const { count, error } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true })
        .eq("episode_id", episodeId)
        .eq("score", score);

      if (error) {
        console.error(`Failed to count score ${score}:`, error.message);
        return { score, count: 0 };
      }
      return { score, count: count ?? 0 };
    })
  );

  const breakdown: Record<number, number> = {};
  let total = 0;
  for (const { score, count } of counts) {
    breakdown[score] = count;
    total += count;
  }

  return NextResponse.json(
    { breakdown, total },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
}
