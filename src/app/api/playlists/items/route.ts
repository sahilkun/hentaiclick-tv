import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Check which of a user's playlists contain a given episode
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ playlists: [], contains: [] });
  }

  // Fetch user's playlists
  const { data: playlists } = await supabase
    .from("playlists")
    .select("id, title, episode_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch which playlists contain this episode
  const playlistIds = (playlists ?? []).map((p) => p.id);
  let contains: string[] = [];

  if (episodeId && playlistIds.length > 0) {
    const { data: items } = await supabase
      .from("playlist_episodes")
      .select("playlist_id")
      .eq("episode_id", episodeId)
      .in("playlist_id", playlistIds);

    contains = (items ?? []).map((i) => i.playlist_id);
  }

  return NextResponse.json({ playlists: playlists ?? [], contains });
}

// POST: Add episode to playlist
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlist_id, episode_id } = await request.json();

  // Verify user owns the playlist
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlist_id)
    .eq("user_id", user.id)
    .single();

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Get next position
  const { count } = await supabase
    .from("playlist_episodes")
    .select("*", { count: "exact", head: true })
    .eq("playlist_id", playlist_id);

  const { error } = await supabase.from("playlist_episodes").insert({
    playlist_id,
    episode_id,
    position: (count ?? 0) + 1,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already in playlist" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update episode_count
  await supabase
    .from("playlists")
    .update({ episode_count: (count ?? 0) + 1 })
    .eq("id", playlist_id);

  return NextResponse.json({ ok: true });
}

// DELETE: Remove episode from playlist
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlist_id, episode_id } = await request.json();

  // Verify user owns the playlist
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlist_id)
    .eq("user_id", user.id)
    .single();

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("playlist_episodes")
    .delete()
    .eq("playlist_id", playlist_id)
    .eq("episode_id", episode_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update episode_count
  const { count } = await supabase
    .from("playlist_episodes")
    .select("*", { count: "exact", head: true })
    .eq("playlist_id", playlist_id);

  await supabase
    .from("playlists")
    .update({ episode_count: count ?? 0 })
    .eq("id", playlist_id);

  return NextResponse.json({ ok: true });
}
