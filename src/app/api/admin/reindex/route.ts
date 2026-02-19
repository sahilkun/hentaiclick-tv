import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMeilisearchAdminClient } from "@/lib/meilisearch/client";
import { reindexAllEpisodes, configureIndex } from "@/lib/meilisearch/sync";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = getMeilisearchAdminClient();
    const index = client.index("episodes");
    const stats = await index.getStats();
    const health = await client.health();
    return NextResponse.json({
      healthy: health.status === "available",
      numberOfDocuments: stats.numberOfDocuments,
    });
  } catch (error) {
    return NextResponse.json(
      { healthy: false, numberOfDocuments: 0, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await configureIndex();
    const count = await reindexAllEpisodes();
    return NextResponse.json({ ok: true, indexed: count });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
