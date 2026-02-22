import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH: Update playlist (title, is_public)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim().slice(0, 100);
  }
  if (typeof body.is_public === "boolean") {
    updates.is_public = body.is_public;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("playlists")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ playlist: data });
}

// DELETE: Delete playlist and all its episodes
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Delete playlist episodes first
  await supabase
    .from("playlist_episodes")
    .delete()
    .eq("playlist_id", id);

  // Delete the playlist
  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
