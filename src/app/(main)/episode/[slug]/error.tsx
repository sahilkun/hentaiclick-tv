"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EpisodeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold text-destructive">
        Failed to load episode
      </h1>
      <p className="text-muted-foreground">
        The episode could not be loaded. It may have been removed or there was a
        server error.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-border px-6 text-sm font-medium hover:bg-accent"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
