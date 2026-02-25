import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";
import { isValidUUID } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;

  if (!isValidUUID(episodeId)) {
    return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });
  }

  const headersList = await headers();

  // Hash the IP with a secret salt for privacy
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  // Rate limit: 10 view recordings per IP per minute
  if (!rateLimit(`view:${ip}`, 10, 60_000).success) {
    return NextResponse.json({ ok: true }); // Silently accept
  }

  const salt = process.env.IP_HASH_SALT ?? "default-view-salt";
  const ipHash = crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex");

  const supabase = await createClient();

  try {
    await supabase.rpc("record_episode_view", {
      p_episode_id: episodeId,
      p_ip_hash: ipHash,
    });

    // Sync updated stats to MeiliSearch (fire-and-forget)
    syncEpisodeStats(episodeId).catch(console.error);
  } catch (error) {
    console.error("Error recording view:", error);
  }

  return NextResponse.json({ ok: true });
}
