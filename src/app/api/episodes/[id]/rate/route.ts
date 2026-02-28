import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";
import { isValidUUID, validateOrigin, parseJsonBody, isParseError } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ score: null });
  }

  const { data } = await supabase
    .from("ratings")
    .select("score")
    .eq("user_id", user.id)
    .eq("episode_id", episodeId)
    .maybeSingle();

  return NextResponse.json({ score: data?.score ?? null });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { id: episodeId } = await params;

  if (!isValidUUID(episodeId)) {
    return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!rateLimit(`rate:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ score: number }>(request);
  if (isParseError(body)) return body;
  const { score } = body;

  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 10) {
    return NextResponse.json(
      { error: "Score must be an integer between 1 and 10" },
      { status: 400 }
    );
  }

  // Verify episode exists and is published
  const { data: episode } = await supabase
    .from("episodes")
    .select("id")
    .eq("id", episodeId)
    .eq("status", "published")
    .single();

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      user_id: user.id,
      episode_id: episodeId,
      score,
    },
    { onConflict: "user_id,episode_id" }
  );

  if (error) {
    console.error("Failed to save rating:", error.message);
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }

  // Invalidate cached episode data & sync to MeiliSearch
  revalidateTag("episodes", "max");
  syncEpisodeStats(episodeId).catch(console.error);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { id: episodeId } = await params;

  if (!isValidUUID(episodeId)) {
    return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!rateLimit(`rate:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("user_id", user.id)
    .eq("episode_id", episodeId);

  if (error) {
    console.error("Failed to delete rating:", error.message);
    return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
  }

  // Invalidate cached episode data & sync to MeiliSearch
  revalidateTag("episodes", "max");
  syncEpisodeStats(episodeId).catch(console.error);

  return NextResponse.json({ ok: true });
}
