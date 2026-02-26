import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { EpisodeWithRelations } from "@/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: genre } = await supabase
    .from("genres")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!genre) return { title: "Genre Not Found" };

  const description = `Watch the best ${genre.name} hentai episodes in 4K, 1080p, and HD for free.`;

  return {
    title: `${genre.name} Hentai`,
    description,
    openGraph: {
      title: `${genre.name} Hentai | HentaiClick TV`,
      description,
      url: `/genres/${slug}`,
    },
    alternates: { canonical: `/genres/${slug}` },
  };
}

export default async function GenreDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: genre } = await supabase
    .from("genres")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!genre) notFound();

  // Get series that have this genre
  const { data: seriesGenres } = await supabase
    .from("series_genres")
    .select("series_id")
    .eq("genre_id", genre.id);

  const seriesIds = seriesGenres?.map((sg) => sg.series_id) ?? [];

  let episodes: EpisodeWithRelations[] = [];
  if (seriesIds.length > 0) {
    const { data } = await supabase
      .from("episodes")
      .select(
        `*, series:series_id (title, slug, studio:studio_id (name, slug))`
      )
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("upload_date", { ascending: false })
      .limit(50);

    episodes = (data ?? []) as unknown as EpisodeWithRelations[];
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Genres", item: `${siteUrl}/genres` },
      { "@type": "ListItem", position: 3, name: genre.name, item: `${siteUrl}/genres/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="mx-auto max-w-[100%] xl:max-w-[95%] 2xl:max-w-[85%] sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Genres", href: "/genres" },
          { label: genre.name },
        ]} />
        <h1 className="mb-6 text-2xl font-bold">{genre.name}</h1>
        <EpisodeGrid episodes={episodes} />
      </div>
    </>
  );
}
