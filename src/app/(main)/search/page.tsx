"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import { EpisodeGrid, EpisodeGridSkeleton } from "@/components/episode/episode-grid";
import { SEARCH_PAGE_SIZE } from "@/lib/constants";
import type { EpisodeWithRelations } from "@/types";

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
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1")
  );
  const [results, setResults] = useState<EpisodeWithRelations[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", sort);
    params.set("limit", String(SEARCH_PAGE_SIZE));
    params.set("offset", String((page - 1) * SEARCH_PAGE_SIZE));
    if (minRating !== "0") params.set("min_rating", minRating);

    try {
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Map Meilisearch hits to EpisodeWithRelations shape
        setResults(
          data.hits.map((hit: any) => ({
            id: hit.id,
            title: hit.title,
            slug: hit.slug,
            thumbnail_url: hit.thumbnailUrl,
            cdn_slug: hit.cdnSlug,
            download_filename: hit.downloadFilename ?? "",
            available_qualities: hit.availableQualities ?? [],
            gallery_urls: hit.galleryUrls ?? [],
            poster_url: hit.posterUrl,
            season_no: 1,
            episode_no: 1,
            series_id: null,
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
  }, [query, sort, minRating, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort !== "uploadDate:desc") params.set("sort", sort);
    if (minRating !== "0") params.set("min_rating", minRating);
    if (page > 1) params.set("page", String(page));

    const url = `/search${params.toString() ? `?${params}` : ""}`;
    router.replace(url, { scroll: false });
  }, [query, sort, minRating, page, router]);

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
      <div className="mb-6 flex flex-wrap items-center gap-3">
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
      </div>

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
