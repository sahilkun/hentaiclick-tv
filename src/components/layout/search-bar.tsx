"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEARCH_DEBOUNCE_MS, SEARCH_DROPDOWN_LIMIT } from "@/lib/constants";

interface SearchResult {
  slug: string;
  title: string;
  seriesTitle?: string;
  thumbnailUrl?: string;
}

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=${SEARCH_DROPDOWN_LIMIT}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.hits ?? []);
        setOpen(true);
      }
    } catch {
      // silently fail for live search
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), SEARCH_DEBOUNCE_MS);
  };

  const handleSubmit = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/episode/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex].slug);
      } else {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
            placeholder="Search hentai..."
            className="h-9 w-full rounded-l-md border border-r-0 border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-9 items-center rounded-r-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg"
        >
          {results.map((result, index) => (
            <button
              key={result.slug}
              type="button"
              onClick={() => handleSelect(result.slug)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent",
                index === activeIndex && "bg-accent"
              )}
            >
              {result.thumbnailUrl && (
                <Image
                  src={result.thumbnailUrl}
                  alt=""
                  width={64}
                  height={40}
                  className="h-10 w-16 rounded object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{result.title}</p>
                {result.seriesTitle && (
                  <p className="truncate text-xs text-muted-foreground">
                    {result.seriesTitle}
                  </p>
                )}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            className="flex w-full items-center justify-center border-t border-border px-3 py-2 text-sm text-primary hover:bg-accent"
          >
            View all results for &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
