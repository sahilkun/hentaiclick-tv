import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Studios",
  description: "Browse hentai by studio. Find episodes from your favorite studios.",
};

export const revalidate = 3600;

export default async function StudiosPage() {
  const supabase = await createClient();
  const { data: studios } = await supabase
    .from("studios")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Studios</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(studios ?? []).map((studio) => (
          <Link
            key={studio.id}
            href={`/studios/${studio.slug}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center transition-colors hover:bg-accent"
          >
            {studio.logo_url && (
              <img
                src={studio.logo_url}
                alt={studio.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <span className="text-sm font-medium">{studio.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
