import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMMENT_MAX_LENGTH, COMMENT_MAX_NESTING } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");
  if (!episodeId) {
    return NextResponse.json({ error: "episode_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:user_id (
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episode_id, parent_id, content } = await request.json();

  if (!content || content.length > COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be 1-${COMMENT_MAX_LENGTH} characters` },
      { status: 400 }
    );
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
      content,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ comment: data });
}
