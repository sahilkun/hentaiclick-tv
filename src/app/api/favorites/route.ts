import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ favorited: false });
  }

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("episode_id", episodeId)
    .maybeSingle();

  return NextResponse.json({ favorited: !!data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episode_id } = await request.json();

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    episode_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Sync updated stats to MeiliSearch (fire-and-forget)
  syncEpisodeStats(episode_id).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episode_id } = await request.json();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("episode_id", episode_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Sync updated stats to MeiliSearch (fire-and-forget)
  syncEpisodeStats(episode_id).catch(() => {});

  return NextResponse.json({ ok: true });
}
