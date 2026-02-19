import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  const supabase = await createClient();
  const { data: seriesData } = await supabase
    .from("series")
    .select(`*, studio:studio_id (name)`)
    .order("title", { ascending: true });

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
    </div>
  );
}
