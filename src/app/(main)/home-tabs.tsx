"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import type { EpisodeWithRelations } from "@/types";

interface HomeTabsProps {
  primarySections: Record<string, EpisodeWithRelations[]>;
  secondarySections: Record<string, EpisodeWithRelations[]>;
}

export function HomeTabs({
  primarySections,
  secondarySections,
}: HomeTabsProps) {
  const primaryKeys = Object.keys(primarySections);
  const secondaryKeys = Object.keys(secondarySections);

  const [primaryTab, setPrimaryTab] = useState(primaryKeys[0]);
  const [secondaryTab, setSecondaryTab] = useState(secondaryKeys[0]);

  return (
    <>
      {/* Primary Tabs */}
      <div>
        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
          {primaryKeys.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPrimaryTab(tab)}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === primaryTab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <EpisodeGrid episodes={primarySections[primaryTab] ?? []} />

        <div className="mt-8 flex justify-center">
          <Link
            href="/search"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            More {primaryTab}
          </Link>
        </div>
      </div>

      {/* Secondary Tabs */}
      <div className="mt-12">
        <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
          {secondaryKeys.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSecondaryTab(tab)}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === secondaryTab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <EpisodeGrid episodes={secondarySections[secondaryTab] ?? []} />
      </div>
    </>
  );
}
