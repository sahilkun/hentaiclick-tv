"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background",
          className
        )}
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-accent",
        className
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

/** Pill-style toggle switch for use inside menus */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-7 w-14 rounded-full bg-muted" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setTheme(isDark ? "light" : "dark");
      }}
      className={cn(
        "relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        isDark ? "bg-zinc-700" : "bg-zinc-300"
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sliding knob */}
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
          isDark ? "translate-x-8" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-zinc-700" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" />
        )}
      </span>
    </button>
  );
}
