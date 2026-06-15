import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminSeriesPage({ searchParams }: Props) {
  const { q = "", page: pageRaw = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const supabase = await createClient();

  // Same pattern as /admin/episodes — server-side ilike on title + slug,
  // exact count for pagination, page state in URL for bookmarkability.
  let query = supabase
    .from("series")
    .select(`*, studio:studio_id (name)`, { count: "exact" })
    .order("title", { ascending: true });

  if (q.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: seriesData, count } = await query.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(to + 1, total);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/series?${qs}` : "/admin/series";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Series</h1>
        <Link href="/admin/series/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New Series
          </Button>
        </Link>
      </div>

      <form action="/admin/series" method="GET" className="mb-4 flex gap-2">
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
          <Link href="/admin/series">
            <Button type="button" variant="outline">
              Clear
            </Button>
          </Link>
        )}
      </form>

      <p className="mb-3 text-sm text-muted-foreground">
        {total === 0
          ? q
            ? `No series match “${q}”.`
            : "No series."
          : `Showing ${showingFrom}–${showingTo} of ${total}${q ? ` matching “${q}”` : ""}`}
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Studio</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Year</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(seriesData ?? []).map((s: any) => (
              <tr key={s.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.studio?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{s.status}</Badge>
                </td>
                <td className="px-4 py-3">{s.year ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/series/${s.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
