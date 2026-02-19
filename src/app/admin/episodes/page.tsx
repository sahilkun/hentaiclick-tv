import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEpisodesPage() {
  const supabase = await createClient();

  const { data: episodes } = await supabase
    .from("episodes")
    .select(
      `*, series:series_id (title)`
    )
    .order("upload_date", { ascending: false })
    .limit(50);

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
                  <Link
                    href={`/admin/episodes/${ep.id}/edit`}
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
    </div>
  );
}
