import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const supabase = await createClient();

  // Get all ratings for this episode, grouped by score
  const { data, error } = await supabase
    .from("ratings")
    .select("score")
    .eq("episode_id", episodeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build breakdown: count per score (1-10)
  const breakdown: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) {
    breakdown[i] = 0;
  }

  let total = 0;
  for (const row of data ?? []) {
    if (row.score >= 1 && row.score <= 10) {
      breakdown[row.score]++;
      total++;
    }
  }

  return NextResponse.json({ breakdown, total });
}
