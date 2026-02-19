"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { value: "system", icon: Monitor, label: "System" },
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
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
        <Monitor className="h-4 w-4" />
      </button>
    );
  }

  const cycle = () => {
    const order = ["system", "light", "dark"];
    const currentIndex = order.indexOf(theme ?? "system");
    const nextIndex = (currentIndex + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const current = themes.find((t) => t.value === theme) ?? themes[0];
  const Icon = current.icon;

  return (
    <button
      onClick={cycle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-accent",
        className
      )}
      title={`Theme: ${current.label}`}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">Toggle theme ({current.label})</span>
    </button>
  );
}
