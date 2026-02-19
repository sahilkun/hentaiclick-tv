"use client";

import { useState } from "react";
import { cn, getRatingBgColor } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";

interface RatingPickerProps {
  episodeId: string;
  initialRating: number | null;
  className?: string;
}

export function RatingPicker({
  episodeId,
  initialRating,
  className,
}: RatingPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRate = async (score: number) => {
    if (!user) {
      toast("Log in to rate episodes", "info");
      return;
    }

    setLoading(true);
    const previousRating = rating;
    setRating(score);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });

      if (!res.ok) {
        setRating(previousRating);
        toast("Failed to submit rating", "error");
      } else {
        toast(`Rated ${score}/10`, "success");
      }
    } catch {
      setRating(previousRating);
      toast("Failed to submit rating", "error");
    }

    setLoading(false);
  };

  const handleClear = async () => {
    if (!user || rating === null) return;

    setLoading(true);
    const previousRating = rating;
    setRating(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/rate`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setRating(previousRating);
        toast("Failed to clear rating", "error");
      } else {
        toast("Rating cleared", "info");
      }
    } catch {
      setRating(previousRating);
    }

    setLoading(false);
  };

  const displayRating = hoveredRating ?? rating;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
          const isActive =
            displayRating !== null && score <= displayRating;
          return (
            <button
              key={score}
              type="button"
              disabled={loading}
              onMouseEnter={() => setHoveredRating(score)}
              onMouseLeave={() => setHoveredRating(null)}
              onClick={() => handleRate(score)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-colors",
                isActive
                  ? cn("text-white", getRatingBgColor(score))
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {rating !== null ? (
          <>
            <span>Your rating: {rating}/10</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="text-primary hover:underline"
            >
              Clear
            </button>
          </>
        ) : (
          <span>Click to rate</span>
        )}
      </div>
    </div>
  );
}
