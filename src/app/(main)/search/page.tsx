"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X, Ban, Building2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import {
  EpisodeGrid,
  EpisodeGridSkeleton,
} from "@/components/episode/episode-grid";
import { SEARCH_PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EpisodeWithRelations } from "@/types";

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  is_subgenre: boolean;
  parent_genre_id: string | null;
  episode_count: number;
}

interface StudioItem {
  id: string;
  name: string;
  slug: string;
  episode_count: number;
}

interface GenreGroup {
  parent: GenreItem;
  children: GenreItem[];
}

const SORT_OPTIONS = [
  { value: "uploadDate:desc", label: "Recently Uploaded" },
  { value: "releaseDate:desc", label: "Recently Released" },
  { value: "uploadDate:asc", label: "Oldest Uploads" },
  { value: "releaseDate:asc", label: "Oldest Releases" },
  { value: "title:asc", label: "A-Z" },
  { value: "title:desc", label: "Z-A" },
  { value: "viewCount:desc", label: "Most Views" },
  { value: "ratingAvg:desc", label: "Rating (High → Low)" },
  { value: "ratingAvg:asc", label: "Rating (Low → High)" },
];

const RATING_OPTIONS = [
  { value: "0", label: "Any Rating" },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `Min ${i + 1}/10`,
  })),
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "0", label: "All Years" },
  ...Array.from({ length: currentYear - 1999 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState(
    searchParams.get("sort") ?? "uploadDate:desc"
  );
  const [minRating, setMinRating] = useState(
    searchParams.get("min_rating") ?? "0"
  );
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get("year") ?? "0"
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    searchParams.get("genres")?.split(",").filter(Boolean) ?? []
  );
  const [blacklistedGenres, setBlacklistedGenres] = useState<string[]>(
    searchParams.get("blacklist")?.split(",").filter(Boolean) ?? []
  );
  const [selectedStudios, setSelectedStudios] = useState<string[]>(
    searchParams.get("studios")?.split(",").filter(Boolean) ?? []
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1")
  );
  const [results, setResults] = useState<EpisodeWithRelations[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);

  // Genres state
  const [allGenres, setAllGenres] = useState<GenreItem[]>([]);
  const [genreGroups, setGenreGroups] = useState<GenreGroup[]>([]);
  const [standaloneGenres, setStandaloneGenres] = useState<GenreItem[]>([]);
  const [showGenres, setShowGenres] = useState(
    (searchParams.get("genres")?.split(",").filter(Boolean) ?? []).length > 0
  );
  const [showBlacklist, setShowBlacklist] = useState(
    (searchParams.get("blacklist")?.split(",").filter(Boolean) ?? []).length > 0
  );

  // Studios state
  const [allStudios, setAllStudios] = useState<StudioItem[]>([]);
  const [showStudios, setShowStudios] = useState(
    (searchParams.get("studios")?.split(",").filter(Boolean) ?? []).length > 0
  );

  // Fetch genres and studios on mount
  useEffect(() => {
    fetch("/api/studios")
      .then((r) => r.json())
      .then((studios: StudioItem[]) => setAllStudios(studios))
      .catch(() => {});

    fetch("/api/genres")
      .then((r) => r.json())
      .then((genres: GenreItem[]) => {
        setAllGenres(genres);

        const parents = genres.filter((g) => !g.is_subgenre);
        const children = genres.filter((g) => g.is_subgenre);

        const groups: GenreGroup[] = [];
        const parentsWithChildren = new Set<string>();

        for (const parent of parents) {
          const kids = children.filter(
            (c) => c.parent_genre_id === parent.id
          );
          if (kids.length > 0) {
            groups.push({ parent, children: kids });
            parentsWithChildren.add(parent.id);
          }
        }

        const standalone = parents.filter(
          (p) => !parentsWithChildren.has(p.id)
        );

        setGenreGroups(groups);
        setStandaloneGenres(standalone);
      })
      .catch(() => {});
  }, []);

  const toggleGenre = (slug: string) => {
    // Don't allow selecting a blacklisted genre
    if (blacklistedGenres.includes(slug)) return;
    setSelectedGenres((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
    setPage(1);
  };

  const clearGenres = () => {
    setSelectedGenres([]);
    setPage(1);
  };

  const toggleBlacklist = (slug: string) => {
    setBlacklistedGenres((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
    // Also remove from selected genres if it's being blacklisted
    setSelectedGenres((prev) => prev.filter((s) => s !== slug));
    setPage(1);
  };

  const clearBlacklist = () => {
    setBlacklistedGenres([]);
    setPage(1);
  };

  const toggleStudio = (slug: string) => {
    setSelectedStudios((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
    setPage(1);
  };

  const clearStudios = () => {
    setSelectedStudios([]);
    setPage(1);
  };

  const fetchResults = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", sort);
    params.set("limit", String(SEARCH_PAGE_SIZE));
    params.set("offset", String((page - 1) * SEARCH_PAGE_SIZE));
    if (minRating !== "0") params.set("min_rating", minRating);
    if (selectedYear !== "0") params.set("year", selectedYear);
    if (selectedGenres.length > 0)
      params.set("genres", selectedGenres.join(","));
    if (blacklistedGenres.length > 0)
      params.set("blacklist", blacklistedGenres.join(","));
    if (selectedStudios.length > 0)
      params.set("studios", selectedStudios.join(","));

    try {
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(
          data.hits.map((hit: any) => ({
            id: hit.id,
            title: hit.title,
            slug: hit.slug,
            thumbnail_url: hit.thumbnailUrl,
            stream_links: hit.streamLinks ?? {},
            download_links: hit.downloadLinks ?? {},
            subtitle_links: hit.subtitleLinks ?? {},
            thumbnail_path: hit.thumbnailPath ?? "",
            gallery_urls: hit.galleryUrls ?? [],
            poster_url: hit.posterUrl,
            season_no: 1,
            episode_no: 1,
            studio_id: null,
            series_id: null,
            description: hit.description ?? "",
            duration_seconds: hit.durationSeconds ?? 0,
            upload_date: hit.uploadDate,
            release_date: hit.releaseDate,
            status: "published" as const,
            rating_avg: hit.ratingAvg ?? 0,
            rating_count: hit.ratingCount ?? 0,
            view_count: hit.viewCount ?? 0,
            like_count: hit.likeCount ?? 0,
            comment_count: hit.commentCount ?? 0,
            views_7d: hit.views7d ?? 0,
            meta_title: null,
            meta_description: null,
            created_at: hit.uploadDate,
            updated_at: hit.uploadDate,
            series: hit.seriesTitle
              ? { title: hit.seriesTitle, slug: hit.seriesSlug }
              : null,
          }))
        );
        setTotalHits(data.totalHits);
      }
    } catch {}

    setLoading(false);
  }, [query, sort, minRating, selectedYear, selectedGenres, blacklistedGenres, selectedStudios, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "uploadDate:desc") params.set("sort", sort);
    if (minRating !== "0") params.set("min_rating", minRating);
    if (selectedYear !== "0") params.set("year", selectedYear);
    if (selectedGenres.length > 0)
      params.set("genres", selectedGenres.join(","));
    if (blacklistedGenres.length > 0)
      params.set("blacklist", blacklistedGenres.join(","));
    if (selectedStudios.length > 0)
      params.set("studios", selectedStudios.join(","));
    if (page > 1) params.set("page", String(page));

    const url = `/search${params.toString() ? `?${params}` : ""}`;
    router.replace(url, { scroll: false });
  }, [query, sort, minRating, selectedYear, selectedGenres, blacklistedGenres, selectedStudios, page, router]);

  const totalPages = Math.ceil(totalHits / SEARCH_PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hentai..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CustomSelect
          options={SORT_OPTIONS}
          value={sort}
          onChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          placeholder="Sort by"
          className="w-48"
        />
        <CustomSelect
          options={RATING_OPTIONS}
          value={minRating}
          onChange={(val) => {
            setMinRating(val);
            setPage(1);
          }}
          placeholder="Min Rating"
          className="w-40"
        />
        <CustomSelect
          options={YEAR_OPTIONS}
          value={selectedYear}
          onChange={(val) => {
            setSelectedYear(val);
            setPage(1);
          }}
          placeholder="Year"
          className="w-36"
        />
        <button
          type="button"
          onClick={() => setShowGenres(!showGenres)}
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors",
            showGenres
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background"
          )}
        >
          <span>Genres</span>
          {selectedGenres.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                showGenres
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {selectedGenres.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              showGenres && "rotate-180"
            )}
          />
        </button>

        <button
          type="button"
          onClick={() => setShowBlacklist(!showBlacklist)}
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors",
            showBlacklist
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background"
          )}
        >
          <Ban className="h-3.5 w-3.5" />
          <span>Blacklist</span>
          {blacklistedGenres.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                showBlacklist
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {blacklistedGenres.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              showBlacklist && "rotate-180"
            )}
          />
        </button>

        <button
          type="button"
          onClick={() => setShowStudios(!showStudios)}
          className={cn(
            "flex h-10 items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors",
            showStudios
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background"
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Studios</span>
          {selectedStudios.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                showStudios
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {selectedStudios.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              showStudios && "rotate-180"
            )}
          />
        </button>

        {selectedGenres.length > 0 && (
          <button
            type="button"
            onClick={clearGenres}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear genres
          </button>
        )}
        {blacklistedGenres.length > 0 && (
          <button
            type="button"
            onClick={clearBlacklist}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear blacklist
          </button>
        )}
        {selectedStudios.length > 0 && (
          <button
            type="button"
            onClick={clearStudios}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear studios
          </button>
        )}
      </div>

      {/* Selected genre tags (when panel is closed) */}
      {selectedGenres.length > 0 && !showGenres && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selectedGenres.map((slug) => {
            const genre = allGenres.find((g) => g.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleGenre(slug)}
                className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/30"
              >
                {genre?.name ?? slug}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Genre filter panel */}
      {showGenres && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          {/* Standalone genres (no children) */}
          {standaloneGenres.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Genres
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {standaloneGenres.map((genre) => (
                  <GenreTag
                    key={genre.slug}
                    genre={genre}
                    selected={selectedGenres.includes(genre.slug)}
                    disabled={blacklistedGenres.includes(genre.slug)}
                    onClick={() => toggleGenre(genre.slug)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grouped genres (parent + children) */}
          {genreGroups.map((group) => (
            <div key={group.parent.id} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {group.parent.name}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {group.children.map((genre) => (
                  <GenreTag
                    key={genre.slug}
                    genre={genre}
                    selected={selectedGenres.includes(genre.slug)}
                    disabled={blacklistedGenres.includes(genre.slug)}
                    onClick={() => toggleGenre(genre.slug)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blacklisted genre tags (when panel is closed) */}
      {blacklistedGenres.length > 0 && !showBlacklist && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {blacklistedGenres.map((slug) => {
            const genre = allGenres.find((g) => g.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleBlacklist(slug)}
                className="flex items-center gap-1 rounded-full bg-destructive/20 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/30"
              >
                <Ban className="h-3 w-3" />
                {genre?.name ?? slug}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Blacklist filter panel */}
      {showBlacklist && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-card p-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Select genres to exclude from search results
          </p>
          {/* Standalone genres (no children) */}
          {standaloneGenres.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Genres
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {standaloneGenres.map((genre) => (
                  <GenreTag
                    key={genre.slug}
                    genre={genre}
                    selected={blacklistedGenres.includes(genre.slug)}
                    variant="blacklist"
                    onClick={() => toggleBlacklist(genre.slug)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grouped genres (parent + children) */}
          {genreGroups.map((group) => (
            <div key={group.parent.id} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {group.parent.name}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {group.children.map((genre) => (
                  <GenreTag
                    key={genre.slug}
                    genre={genre}
                    selected={blacklistedGenres.includes(genre.slug)}
                    variant="blacklist"
                    onClick={() => toggleBlacklist(genre.slug)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected studio tags (when panel is closed) */}
      {selectedStudios.length > 0 && !showStudios && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selectedStudios.map((slug) => {
            const studio = allStudios.find((s) => s.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleStudio(slug)}
                className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/30"
              >
                <Building2 className="h-3 w-3" />
                {studio?.name ?? slug}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Studio filter panel */}
      {showStudios && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Studios
          </h3>
          {allStudios.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading studios...</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allStudios.map((studio) => (
                <button
                  key={studio.slug}
                  type="button"
                  onClick={() => toggleStudio(studio.slug)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    selectedStudios.includes(studio.slug)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
                  )}
                >
                  {studio.name}
                  {studio.episode_count > 0 && (
                    <span className="ml-1 opacity-60">
                      ({studio.episode_count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        Showing {Math.min((page - 1) * SEARCH_PAGE_SIZE + 1, totalHits)} to{" "}
        {Math.min(page * SEARCH_PAGE_SIZE, totalHits)} of {totalHits} results
      </p>

      {/* Results grid */}
      {loading ? (
        <EpisodeGridSkeleton count={SEARCH_PAGE_SIZE} />
      ) : (
        <EpisodeGrid episodes={results} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function GenreTag({
  genre,
  selected,
  disabled,
  variant = "default",
  onClick,
}: {
  genre: GenreItem;
  selected: boolean;
  disabled?: boolean;
  variant?: "default" | "blacklist";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
        disabled && "opacity-40 cursor-not-allowed",
        variant === "blacklist"
          ? selected
            ? "bg-destructive text-destructive-foreground"
            : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
          : selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
      )}
    >
      {genre.name}
      {genre.episode_count > 0 && (
        <span className={cn(
          "ml-1 opacity-60",
        )}>
          ({genre.episode_count})
        </span>
      )}
    </button>
  );
}
