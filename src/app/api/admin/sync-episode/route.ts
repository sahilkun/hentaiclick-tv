import { NextResponse } from "next/server";
import { requireModerator, isAuthError } from "@/lib/auth";
import { syncEpisode } from "@/lib/meilisearch/sync";

export async function POST(request: Request) {
  const auth = await requireModerator();
  if (isAuthError(auth)) return auth;

  const { episodeId } = await request.json();
  if (!episodeId) {
    return NextResponse.json({ error: "Missing episodeId" }, { status: 400 });
  }

  try {
    await syncEpisode(episodeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Episode sync failed:", error);
    return NextResponse.json(
      { ok: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
