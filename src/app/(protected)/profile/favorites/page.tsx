"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { EpisodeGrid, EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import type { EpisodeWithRelations } from "@/types";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<EpisodeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("favorites")
        .select(
          `
          episode:episode_id (
            *,
            series:series_id (title, slug, studio:studio_id (name, slug))
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const eps =
        data
          ?.map((f: any) => f.episode)
          .filter(Boolean) ?? [];
      setEpisodes(eps as unknown as EpisodeWithRelations[]);
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
      {loading ? (
        <EpisodeGridSkeleton count={8} />
      ) : (
        <EpisodeGrid episodes={episodes} />
      )}
    </div>
  );
}
