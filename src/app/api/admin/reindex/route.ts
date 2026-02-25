import { NextResponse } from "next/server";
import { requireModerator, requireAdmin, isAuthError } from "@/lib/auth";
import { getMeilisearchAdminClient } from "@/lib/meilisearch/client";
import { reindexAllEpisodes, configureIndex } from "@/lib/meilisearch/sync";

export async function GET() {
  const auth = await requireModerator();
  if (isAuthError(auth)) return auth;

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
      { healthy: false, numberOfDocuments: 0, error: "MeiliSearch unavailable" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  try {
    await configureIndex();
    const count = await reindexAllEpisodes();
    return NextResponse.json({ ok: true, indexed: count });
  } catch (error) {
    console.error("Reindex failed:", error);
    return NextResponse.json(
      { ok: false, error: "Reindex failed" },
      { status: 500 }
    );
  }
}
