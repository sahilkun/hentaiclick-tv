import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
  return num.toString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getRatingColor(rating: number): string {
  if (rating >= 9) return "text-green-500 bg-green-500/20";
  if (rating >= 7) return "text-lime-500 bg-lime-500/20";
  if (rating >= 5) return "text-yellow-500 bg-yellow-500/20";
  if (rating >= 3) return "text-orange-500 bg-orange-500/20";
  return "text-red-500 bg-red-500/20";
}

export function getRatingBgColor(rating: number): string {
  if (rating >= 9) return "bg-green-500";
  if (rating >= 7) return "bg-lime-500";
  if (rating >= 5) return "bg-yellow-500";
  if (rating >= 3) return "bg-orange-500";
  return "bg-red-500";
}
