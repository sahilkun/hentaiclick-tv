"use client";

import { cn } from "@/lib/utils";

interface PlayerToastProps {
  message: string | null;
}

export function PlayerToast({ message }: PlayerToastProps) {
  if (!message) return null;

  return (
    <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
      {message}
    </div>
  );
}
