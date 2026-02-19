"use client";

import { useState, useEffect } from "react";
import { EpisodeGrid, EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import type { EpisodeWithRelations } from "@/types";
import { WATCH_HISTORY_MAX_ENTRIES } from "@/lib/constants";

interface HistoryEntry {
  slug: string;
  title: string;
  timestamp: number;
}

// localStorage watch history
function getWatchHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("watch_history") ?? "[]");
  } catch {
    return [];
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Watch History</h1>

      {history.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No watch history yet.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <a
              key={entry.slug + entry.timestamp}
              href={`/episode/${entry.slug}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"
            >
              <span className="text-sm font-medium">{entry.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
