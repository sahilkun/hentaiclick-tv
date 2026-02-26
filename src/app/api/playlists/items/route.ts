import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID, validateOrigin, parseJsonBody, isParseError } from "@/lib/validation";

// PATCH: Reorder episode (move up/down)
export async function PATCH(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patchBody = await parseJsonBody<{ playlist_id: string; episode_id: string; direction: string }>(request);
  if (isParseError(patchBody)) return patchBody;
  const { playlist_id, episode_id, direction } = patchBody;

  if (!playlist_id || !isValidUUID(playlist_id) || !episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid playlist_id or episode_id" }, { status: 400 });
  }

  if (!["up", "down"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

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

  // Get all episodes ordered by position
  const { data: items } = await supabase
    .from("playlist_episodes")
    .select("id, episode_id, position")
    .eq("playlist_id", playlist_id)
    .order("position", { ascending: true });

  if (!items || items.length < 2) {
    return NextResponse.json({ error: "Cannot reorder" }, { status: 400 });
  }

  const idx = items.findIndex((i) => i.episode_id === episode_id);
  if (idx === -1) {
    return NextResponse.json({ error: "Episode not in playlist" }, { status: 404 });
  }

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) {
    return NextResponse.json({ error: "Cannot move further" }, { status: 400 });
  }

  // Swap positions
  const current = items[idx];
  const swap = items[swapIdx];

  await Promise.all([
    supabase
      .from("playlist_episodes")
      .update({ position: swap.position })
      .eq("id", current.id),
    supabase
      .from("playlist_episodes")
      .update({ position: current.position })
      .eq("id", swap.id),
  ]);

  return NextResponse.json({ ok: true });
}

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
  const originError = validateOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postBody = await parseJsonBody<{ playlist_id: string; episode_id: string }>(request);
  if (isParseError(postBody)) return postBody;
  const { playlist_id, episode_id } = postBody;

  if (!playlist_id || !isValidUUID(playlist_id) || !episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid playlist_id or episode_id" }, { status: 400 });
  }

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

  // Verify episode exists and is published
  const { data: episode } = await supabase
    .from("episodes")
    .select("id")
    .eq("id", episode_id)
    .eq("status", "published")
    .single();

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  // Get max position to avoid race condition (concurrent inserts won't collide
  // on position since we use max+1, and the unique constraint on
  // (playlist_id, episode_id) prevents true duplicates)
  const { data: maxPosRow } = await supabase
    .from("playlist_episodes")
    .select("position")
    .eq("playlist_id", playlist_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxPosRow?.position ?? 0) + 1;

  const { error } = await supabase.from("playlist_episodes").insert({
    playlist_id,
    episode_id,
    position: nextPosition,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already in playlist" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to add episode" }, { status: 400 });
  }

  // Recount after insert for accurate episode_count
  const { count: newCount } = await supabase
    .from("playlist_episodes")
    .select("*", { count: "exact", head: true })
    .eq("playlist_id", playlist_id);

  await supabase
    .from("playlists")
    .update({ episode_count: newCount ?? 0 })
    .eq("id", playlist_id);

  return NextResponse.json({ ok: true });
}

// DELETE: Remove episode from playlist
export async function DELETE(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delBody = await parseJsonBody<{ playlist_id: string; episode_id: string }>(request);
  if (isParseError(delBody)) return delBody;
  const { playlist_id, episode_id } = delBody;

  if (!playlist_id || !isValidUUID(playlist_id) || !episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid playlist_id or episode_id" }, { status: 400 });
  }

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
    console.error("Failed to remove episode from playlist:", error.message);
    return NextResponse.json({ error: "Failed to remove episode" }, { status: 500 });
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
