"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

/**
 * Per-row "Duplicate" action for the admin episodes table.
 *
 * Clones an episode into a fresh DRAFT and drops the editor on the copy.
 * The duplicate gets:
 *   - status forced to "draft" (never publish a copy implicitly)
 *   - a unique slug (`<slug>-copy`, then `-copy-2`, `-copy-3`… on clash)
 *   - title suffixed " (Copy)"
 *   - all content fields copied verbatim (stream/download/subtitle links,
 *     gallery, poster, regional name, series/studio, episode numbering,
 *     descriptions, dates) plus the episode_genres rows
 *   - stats reset: view/like/comment/7d counts + rating left at the DB
 *     column defaults (a copy hasn't been watched or rated)
 *
 * Runs on the browser Supabase client, same as episode-form.tsx — RLS
 * already gates writes to moderators/admins, so no extra API route.
 */
export function DuplicateEpisodeButton({ episodeId }: { episodeId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDuplicate = async () => {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();

    // 1. Pull the full source row.
    const { data: src, error: readErr } = await supabase
      .from("episodes")
      .select("*")
      .eq("id", episodeId)
      .single();

    if (readErr || !src) {
      toast(readErr?.message ?? "Could not load source episode", "error");
      setBusy(false);
      return;
    }

    // 2. Strip identity / audit / stats columns — everything else is
    //    copied. Omitted keys fall back to their DB column defaults.
    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      view_count: _v,
      like_count: _l,
      comment_count: _cm,
      views_7d: _v7,
      rating_avg: _ra,
      rating_count: _rc,
      ...rest
    } = src as Record<string, unknown>;

    // 3. Find a free slug. Episodes.slug is UNIQUE, so probe until clear.
    const baseSlug = `${src.slug}-copy`;
    let slug = baseSlug;
    for (let n = 2; ; n++) {
      const { data: clash } = await supabase
        .from("episodes")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${n}`;
    }

    // 4. Insert the copy as a draft.
    const { data: created, error: insErr } = await supabase
      .from("episodes")
      .insert({
        ...rest,
        slug,
        title: `${src.title} (Copy)`,
        status: "draft",
      })
      .select("id")
      .single();

    if (insErr || !created) {
      toast(insErr?.message ?? "Duplicate failed", "error");
      setBusy(false);
      return;
    }

    // 5. Copy the genre links.
    const { data: genres } = await supabase
      .from("episode_genres")
      .select("genre_id")
      .eq("episode_id", episodeId);

    if (genres && genres.length > 0) {
      const { error: genreErr } = await supabase
        .from("episode_genres")
        .insert(
          genres.map((g) => ({
            episode_id: created.id,
            genre_id: g.genre_id,
          }))
        );
      if (genreErr) {
        // Non-fatal — the episode copy exists; genres can be re-picked
        // in the editor we're about to open.
        console.error("Duplicate: genre copy failed:", genreErr);
      }
    }

    // Draft is intentionally NOT synced to Meilisearch — syncEpisode
    // only indexes published rows, and the editor will sync on save.
    toast("Episode duplicated — editing the copy", "success");
    router.push(`/admin/episodes/${created.id}/edit`);
  };

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={busy}
      className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
    >
      <Copy className="h-3.5 w-3.5" />
      {busy ? "Duplicating…" : "Duplicate"}
    </button>
  );
}
