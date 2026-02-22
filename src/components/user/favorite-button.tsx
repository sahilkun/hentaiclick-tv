"use client";

import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";

interface FavoriteButtonProps {
  episodeId: string;
  initialFavorited: boolean;
  className?: string;
}

export function FavoriteButton({
  episodeId,
  initialFavorited,
  className,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const hasInteracted = useRef(false);

  // Sync with async-fetched initialFavorited, but skip if user already clicked
  useEffect(() => {
    if (!hasInteracted.current) {
      setFavorited(initialFavorited);
    }
  }, [initialFavorited]);

  const handleToggle = async () => {
    if (!user) {
      toast("Log in to add favorites", "info");
      return;
    }

    setLoading(true);
    hasInteracted.current = true;
    const newState = !favorited;
    setFavorited(newState); // Optimistic

    try {
      const res = await fetch("/api/favorites", {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode_id: episodeId }),
      });

      if (!res.ok) {
        setFavorited(!newState); // Revert
        toast("Failed to update favorite", "error");
      }
    } catch {
      setFavorited(!newState);
      toast("Failed to update favorite", "error");
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
        favorited
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:bg-accent",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-current")}
      />
      {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}
