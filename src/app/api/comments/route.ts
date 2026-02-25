import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";
import { isValidUUID } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");
  if (!episodeId || !isValidUUID(episodeId)) {
    return NextResponse.json({ error: "Valid episode_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:profiles!comments_user_id_profiles_fk (
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("episode_id", episodeId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch comments:", error.message);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`comment:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episode_id, parent_id, content } = await request.json();

  if (!episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid episode_id" }, { status: 400 });
  }

  if (parent_id && !isValidUUID(parent_id)) {
    return NextResponse.json({ error: "Invalid parent_id" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be 1-${COMMENT_MAX_LENGTH} characters` },
      { status: 400 }
    );
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

  // Check nesting depth
  if (parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("parent_id")
      .eq("id", parent_id)
      .single();

    // If parent already has a parent, we're at max nesting
    if (parent?.parent_id) {
      return NextResponse.json(
        { error: "Maximum comment nesting reached" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      episode_id,
      user_id: user.id,
      parent_id: parent_id ?? null,
      content: content.trim(),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create comment:", error.message);
    return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  }

  // Sync updated stats to MeiliSearch (fire-and-forget)
  syncEpisodeStats(episode_id).catch(console.error);

  return NextResponse.json({ comment: data });
}
