"use client";

import { useRef, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EpisodeCard } from "./episode-card";
import type { EpisodeWithRelations } from "@/types";

interface EpisodeCarouselProps {
  episodes: EpisodeWithRelations[];
  title?: string;
  className?: string;
}

export const EpisodeCarousel = memo(function EpisodeCarousel({
  episodes,
  title,
  className,
}: EpisodeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (episodes.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {title && (
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
      )}

      <div className="group relative">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-opacity group-hover:flex hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="w-[280px] flex-none snap-start sm:w-[300px]"
            >
              <EpisodeCard episode={episode} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-opacity group-hover:flex hover:bg-accent"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
});
