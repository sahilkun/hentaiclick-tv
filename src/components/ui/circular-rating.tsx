"use client";

import { cn } from "@/lib/utils";

interface CircularRatingProps {
  rating: number; // 0-10
  count: number;
  size?: number; // px, default 40
  strokeWidth?: number; // px, default 3
  className?: string;
}

function getRingColor(rating: number): string {
  if (rating >= 9) return "#22c55e"; // green-500
  if (rating >= 7) return "#84cc16"; // lime-500
  if (rating >= 5) return "#eab308"; // yellow-500
  if (rating >= 3) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

function getTrackColor(rating: number): string {
  if (rating >= 9) return "rgba(34,197,94,0.25)";
  if (rating >= 7) return "rgba(132,204,22,0.25)";
  if (rating >= 5) return "rgba(234,179,8,0.25)";
  if (rating >= 3) return "rgba(249,115,22,0.25)";
  return "rgba(239,68,68,0.25)";
}

export function CircularRating({
  rating,
  count,
  size = 40,
  strokeWidth = 3,
  className,
}: CircularRatingProps) {
  const hasRating = count > 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = hasRating ? rating / 10 : 0;
  const dashOffset = circumference * (1 - percent);

  const ringColor = hasRating ? getRingColor(rating) : "rgba(255,255,255,0.15)";
  const trackColor = hasRating ? getTrackColor(rating) : "rgba(255,255,255,0.08)";

  // font size scales with component size
  const fontSize = size * 0.3;
  const smallFontSize = size * 0.18;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0,0,0,0.6)"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        {hasRating && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        )}
      </svg>
      {/* Center text */}
      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        {hasRating ? (
          <span
            className="font-bold text-white"
            style={{ fontSize }}
          >
            {rating.toFixed(1)}
          </span>
        ) : (
          <span
            className="font-medium text-white/50"
            style={{ fontSize: smallFontSize }}
          >
            N/A
          </span>
        )}
      </div>
    </div>
  );
}
