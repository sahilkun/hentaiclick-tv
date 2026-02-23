"use client";

import { useState, useEffect } from "react";
import { cn, formatNumber } from "@/lib/utils";
import { CircularRating } from "@/components/ui/circular-rating";

interface RatingBreakdownProps {
  episodeId: string;
  ratingAvg: number;
  ratingCount: number;
}

function getBarColor(score: number): string {
  if (score >= 9) return "bg-green-500";
  if (score >= 7) return "bg-lime-500";
  if (score >= 5) return "bg-yellow-500";
  if (score >= 3) return "bg-orange-500";
  return "bg-red-500";
}

export function RatingBreakdown({
  episodeId,
  ratingAvg,
  ratingCount,
}: RatingBreakdownProps) {
  const [breakdown, setBreakdown] = useState<Record<number, number> | null>(
    null
  );
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/episodes/${episodeId}/ratings`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setBreakdown(data.breakdown);
        setTotal(data.total);
      })
      .catch(() => {});
  }, [episodeId]);

  const hasRating = ratingCount > 0;

  // Find the max count for scaling bars
  const maxCount = breakdown
    ? Math.max(...Object.values(breakdown), 1)
    : 1;

  return (
    <div className="flex items-center gap-6 sm:gap-8">
      {/* Left: CircularRating + vote count */}
      <div className="flex flex-col items-center shrink-0">
        <CircularRating
          rating={ratingAvg}
          count={ratingCount}
          size={128}
          strokeWidth={6}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {hasRating
            ? `${formatNumber(ratingCount)} ${ratingCount === 1 ? "vote" : "votes"}`
            : "No ratings"}
        </p>
      </div>

      {/* Right: Vertical bar chart */}
      {breakdown && total > 0 && (
        <div className="flex-1 min-w-0">
          {/* Bars + labels */}
          <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
              const count = breakdown[score] ?? 0;
              const barHeight = total > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div
                  key={score}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  {count > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="rounded bg-card border border-border px-1.5 py-0.5 text-[10px] text-foreground whitespace-nowrap shadow-md">
                        {((count / total) * 100).toFixed(1)}% ({formatNumber(count)})
                      </div>
                    </div>
                  )}

                  {/* Bar */}
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className={cn(
                        "w-full max-w-[40px] rounded-t-sm transition-all duration-500",
                        getBarColor(score),
                        count === 0 && "bg-muted/30"
                      )}
                      style={{
                        height: count > 0 ? `${Math.max(barHeight, 4)}%` : '3%',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score labels below bars */}
          <div className="flex gap-1 sm:gap-2 mt-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <div key={score} className="flex-1 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton while loading */}
      {!breakdown && hasRating && (
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
            {[25, 15, 20, 35, 50, 30, 45, 40, 55, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className="w-full max-w-[40px] rounded-t-sm bg-muted/30 animate-pulse"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 sm:gap-2 mt-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
