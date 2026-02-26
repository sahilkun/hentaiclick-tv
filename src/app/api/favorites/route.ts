import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";
import { isValidUUID, validateOrigin, parseJsonBody, isParseError } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");

  if (!episodeId || !isValidUUID(episodeId)) {
    return NextResponse.json({ favorited: false });
  }

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
  const originError = validateOrigin(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  if (!rateLimit(`fav:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ episode_id: string }>(request);
  if (isParseError(body)) return body;
  const { episode_id } = body;

  if (!episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid episode_id" }, { status: 400 });
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

  const { error } = await supabase.from("favorites").upsert(
    { user_id: user.id, episode_id },
    { onConflict: "user_id,episode_id" }
  );

  if (error) {
    console.error("Failed to add favorite:", error.message);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }

  // Sync updated stats to MeiliSearch (fire-and-forget)
  syncEpisodeStats(episode_id).catch(console.error);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  if (!rateLimit(`fav:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delBody = await parseJsonBody<{ episode_id: string }>(request);
  if (isParseError(delBody)) return delBody;
  const { episode_id } = delBody;

  if (!episode_id || !isValidUUID(episode_id)) {
    return NextResponse.json({ error: "Invalid episode_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("episode_id", episode_id);

  if (error) {
    console.error("Failed to remove favorite:", error.message);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }

  // Sync updated stats to MeiliSearch (fire-and-forget)
  syncEpisodeStats(episode_id).catch(console.error);

  return NextResponse.json({ ok: true });
}
