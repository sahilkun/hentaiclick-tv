import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const supabase = await createClient();
  const headersList = await headers();

  // Hash the IP for privacy
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  try {
    await supabase.rpc("record_episode_view", {
      p_episode_id: episodeId,
      p_ip_hash: ipHash,
    });
  } catch (error) {
    console.error("Error recording view:", error);
  }

  return NextResponse.json({ ok: true });
}
