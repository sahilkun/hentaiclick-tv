import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { DuplicateEpisodeButton } from "@/components/admin/duplicate-episode-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminEpisodesPage({ searchParams }: Props) {
  const { q = "", page: pageRaw = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const supabase = await createClient();

  // Build the query. ilike for case-insensitive substring search on
  // title + slug. PostgREST `or()` accepts comma-separated filters.
  // We also need `count: 'exact'` to compute the page count below.
  let query = supabase
    .from("episodes")
    .select(`*, series:series_id (title)`, { count: "exact" })
    .order("upload_date", { ascending: false });

  if (q.trim()) {
    const term = q.trim().replace(/[%,]/g, ""); // strip wildcards / separators
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: episodes, count } = await query.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(to + 1, total);

  // Helper to build pagination URLs preserving the current search term.
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/episodes?${qs}` : "/admin/episodes";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Episodes</h1>
        <Link href="/admin/episodes/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New Episode
          </Button>
        </Link>
      </div>

      {/* Search — GET form so the query lands in the URL (bookmarkable,
          works without JS, plays nicely with the server-component page) */}
      <form
        action="/admin/episodes"
        method="GET"
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title or slug…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button type="submit">Search</Button>
        {q && (
          <Link href="/admin/episodes">
            <Button type="button" variant="outline">
              Clear
            </Button>
          </Link>
        )}
      </form>

      <p className="mb-3 text-sm text-muted-foreground">
        {total === 0
          ? q
            ? `No episodes match “${q}”.`
            : "No episodes."
          : `Showing ${showingFrom}–${showingTo} of ${total}${q ? ` matching “${q}”` : ""}`}
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Series</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Views</th>
              <th className="px-4 py-3 text-left font-medium">Rating</th>
              <th className="px-4 py-3 text-left font-medium">Uploaded</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(episodes ?? []).map((ep: any) => (
              <tr key={ep.id} className="border-b border-border">
                <td className="max-w-xs truncate px-4 py-3 font-medium">
                  {ep.title}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ep.series?.title ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      ep.status === "published"
                        ? "success"
                        : ep.status === "draft"
                          ? "secondary"
                          : "warning"
                    }
                  >
                    {ep.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{ep.view_count}</td>
                <td className="px-4 py-3">
                  {ep.rating_count > 0
                    ? `${ep.rating_avg}/10`
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(ep.upload_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/episodes/${ep.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <DuplicateEpisodeButton episodeId={ep.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)}>
                <Button variant="outline" size="sm">
                  ← Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                ← Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)}>
                <Button variant="outline" size="sm">
                  Next →
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
