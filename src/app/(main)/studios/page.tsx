import { safeJsonLd } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAnonClient } from "@/lib/supabase/anon";

export const metadata: Metadata = {
  title: "Browse Hentai by Studio — All Animation Studios",
  description:
    "Browse hentai by animation studio. Find episodes from Pink Pineapple, T-Rex, Lune Pictures, Mary Jane, Queen Bee, and every other studio in the HentaiClick catalog. 4K, 1080p, HD.",
  openGraph: {
    title: "Browse Hentai by Studio | HentaiClick",
    description:
      "Find AI-uncensored hentai episodes from every major studio — streaming and downloads in 4K, 1080p, and HD.",
    url: "/studios",
  },
  alternates: { canonical: "/studios" },
};

export const dynamic = "force-dynamic";

export default async function StudiosPage() {
  const supabase = getAnonClient();
  const { data: studios } = await supabase
    .from("studios")
    .select("*")
    .order("name", { ascending: true });

  const studioList = studios ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/studios#collectionpage`,
    name: "Browse Hentai by Studio",
    description:
      "Index of every animation studio in the HentaiClick catalog — AI-uncensored hentai streaming in 4K, 1080p, and HD.",
    url: `${siteUrl}/studios`,
    inLanguage: "en-US",
    isPartOf: { "@id": `${siteUrl}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: studioList.length,
      itemListElement: studioList.map((studio: any, i: any) => ({
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Browse Hentai by Studio
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Find AI-uncensored hentai by animation studio. HentaiClick mirrors
          releases from every major studio currently producing in Japan —
          Pink Pineapple, T-Rex, Lune Pictures, Mary Jane, Queen Bee, Pashmina,
          Suzuki Mirano, and more. Each studio page lists every episode in the
          catalog from that studio, sorted by latest upload. Streaming is in
          4K, 1080p, or HD with English subtitles; most episodes also offer a
          1080p or 4K MKV download. Combine studio + genre filters from the{" "}
          <Link href="/search" className="text-primary hover:underline">
            search page
          </Link>{" "}
          to narrow further.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {studioList.map((studio: any) => (
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
