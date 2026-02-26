import Link from "next/link";
import type { Metadata } from "next";
import { getGenres } from "@/lib/queries/episodes";

export const metadata: Metadata = {
  title: "Genres",
  description: "Browse hentai by genre. Find your favorite categories and discover new ones. Stream in 4K, 1080p, and HD for free.",
  openGraph: {
    title: "Browse Genres | HentaiClick TV",
    description: "Browse hentai by genre. Find your favorite categories and discover new ones.",
    url: "/genres",
  },
  alternates: { canonical: "/genres" },
};

export const revalidate = 3600;

export default async function GenresPage() {
  const genres = await getGenres();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Genres",
    description: "Browse hentai by genre. Find your favorite categories and discover new ones.",
    url: `${siteUrl}/genres`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: genres.length,
      itemListElement: genres.map((genre, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: genre.name,
        url: `${siteUrl}/genres/${genre.slug}`,
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
        <h1 className="mb-6 text-2xl font-bold">Genres</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/genres/${genre.slug}`}
              className="flex items-center justify-center rounded-lg border border-border bg-card p-6 text-center font-medium transition-colors hover:bg-accent hover:text-primary"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
