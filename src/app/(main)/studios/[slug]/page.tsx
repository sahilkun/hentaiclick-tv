import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAnonClient } from "@/lib/supabase/anon";
import { EpisodeGrid } from "@/components/episode/episode-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getStudioBySlug, getStudioEpisodes } from "@/lib/queries/studios";

export const revalidate = 600;

export async function generateStaticParams() {
  const supabase = getAnonClient();
  const { data } = await supabase.from("studios").select("slug");
  return (data ?? []).map((s: any) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);

  if (!studio) return { title: "Studio Not Found" };

  const description =
    studio.description ||
    `Browse all hentai episodes by ${studio.name}. Stream in 4K, 1080p, and HD for free.`;

  return {
    title: `${studio.name} Episodes`,
    description,
    openGraph: {
      title: `${studio.name} Episodes | HentaiClick TV`,
      description,
      url: `/studios/${slug}`,
    },
    alternates: { canonical: `/studios/${slug}` },
  };
}

export default async function StudioDetailPage({ params }: Props) {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);

  if (!studio) notFound();

  const episodes = await getStudioEpisodes(studio.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Studios", item: `${siteUrl}/studios` },
      { "@type": "ListItem", position: 3, name: studio.name, item: `${siteUrl}/studios/${slug}` },
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
          { label: "Studios", href: "/studios" },
          { label: studio.name },
        ]} />
        <div className="mb-6 flex items-center gap-4">
          {studio.logo_url && (
            <Image
              src={studio.logo_url}
              alt={studio.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{studio.name}</h1>
            {studio.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {studio.description}
              </p>
            )}
          </div>
        </div>

        <EpisodeGrid episodes={episodes} />
      </div>
    </>
  );
}
