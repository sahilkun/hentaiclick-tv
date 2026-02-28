import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { syncEpisodeStats } from "@/lib/meilisearch/sync";
import { isValidUUID, validateOrigin } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = validateOrigin(_request);
  if (originError) return originError;

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

  const salt = process.env.IP_HASH_SALT;
  if (!salt && process.env.NODE_ENV === "production") {
    console.warn("IP_HASH_SALT is not set — using fallback. Set a strong secret in production.");
  }
  const ipHash = crypto
    .createHash("sha256")
    .update(ip + (salt ?? "default-view-salt"))
    .digest("hex");

  const supabase = await createClient();

  const { error } = await supabase.rpc("record_episode_view", {
    p_episode_id: episodeId,
    p_ip_hash: ipHash,
  });

  if (error) {
    console.error("Error recording view:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Invalidate cached episode data & sync to MeiliSearch
  revalidateTag("episodes", "max");
  syncEpisodeStats(episodeId).catch(console.error);

  return NextResponse.json({ ok: true });
}
