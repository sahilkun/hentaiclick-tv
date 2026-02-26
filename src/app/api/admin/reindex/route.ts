import { NextResponse } from "next/server";
import { requireModerator, requireAdmin, isAuthError } from "@/lib/auth";
import { getMeilisearchAdminClient } from "@/lib/meilisearch/client";
import { reindexAllEpisodes, configureIndex } from "@/lib/meilisearch/sync";

let lastReindexTime = 0;

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

  // Rate limit: max once per 5 minutes
  const now = Date.now();
  if (now - lastReindexTime < 5 * 60_000) {
    return NextResponse.json(
      { error: "Reindex in progress or was run recently. Try again in 5 minutes." },
      { status: 429 }
    );
  }
  lastReindexTime = now;

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
