import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Studios",
  description: "Browse hentai by studio. Find episodes from your favorite studios in 4K, 1080p, and HD.",
  openGraph: {
    title: "Browse Studios | HentaiClick TV",
    description: "Browse hentai by studio. Find episodes from your favorite studios.",
    url: "/studios",
  },
  alternates: { canonical: "/studios" },
};

export const revalidate = 3600;

export default async function StudiosPage() {
  const supabase = await createClient();
  const { data: studios } = await supabase
    .from("studios")
    .select("*")
    .order("name", { ascending: true });

  const studioList = studios ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Studios",
    description: "Browse hentai by studio. Find episodes from your favorite studios.",
    url: `${siteUrl}/studios`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: studioList.length,
      itemListElement: studioList.map((studio, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: studio.name,
        url: `${siteUrl}/studios/${studio.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6 text-2xl font-bold">Studios</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {studioList.map((studio) => (
            <Link
              key={studio.id}
              href={`/studios/${studio.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center transition-colors hover:bg-accent"
            >
              {studio.logo_url && (
                <Image
                  src={studio.logo_url}
                  alt={studio.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium">{studio.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
