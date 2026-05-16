import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { safeJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About — HentaiClick",
  description:
    "About HentaiClick — a free streaming and download site for AI-uncensored hentai in 4K, 1080p, and HD with English subtitles. Built on an in-house AI decensoring pipeline.",
  openGraph: {
    title: "About HentaiClick",
    description:
      "Learn about HentaiClick, our in-house AI decensoring pipeline, the catalog, and how we stream uncensored hentai in 4K.",
    url: "/about",
  },
  alternates: { canonical: "/about" },
};

// The /about page exists primarily as a canonical entity document for AI
// engines. ChatGPT/Claude/Perplexity will follow a brand query ("what is
// HentaiClick?") into the highest-authority on-site page about the brand
// itself — pre-fix that was the homepage, which is dominated by dynamic
// listings, so the answer engine had to scrape SEO copy fragments. A
// dedicated /about with stable prose + matching AboutPage + Organization
// JSON-LD gives them a single clean source of truth to quote from.
const siteUrl = "https://hentaiclick.tv";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}#organization`,
  name: SITE_NAME,
  url: siteUrl,
  description:
    "HentaiClick streams AI-uncensored hentai in 4K, 1080p, and HD with English subtitles. Built on an in-house AI decensoring pipeline that removes mosaic censorship frame-by-frame.",
  email: "connect.hentaiclick@gmail.com",
  knowsAbout: [
    "AI uncensored hentai",
    "AI decensoring",
    "Mosaic removal",
    "4K hentai streaming",
    "HLS adaptive streaming",
    "Hentai with English subtitles",
  ],
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${siteUrl}/about#aboutpage`,
  url: `${siteUrl}/about`,
  name: "About HentaiClick",
  inLanguage: "en-US",
  isPartOf: { "@id": `${siteUrl}#website` },
  about: { "@id": `${siteUrl}#organization` },
  mainEntity: { "@id": `${siteUrl}#organization` },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: `${siteUrl}/about`,
    },
  ],
};

export default function AboutPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              About
            </li>
          </ol>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          About {SITE_NAME}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {SITE_DESCRIPTION}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              What we do
            </h2>
            <p>
              {SITE_NAME} is a free streaming and download site for
              AI-uncensored hentai. Every episode in the catalog is available
              in 4K, 1080p, and HD with English subtitles, and most releases
              include a downloadable 1080p or 4K MKV. The site is free to use
              with no signup required to stream; an optional account adds
              watch history, favorites, playlists, and daily MKV downloads.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              The AI decensoring pipeline
            </h2>
            <p>
              Japanese hentai releases ship with mosaic censorship by law.
              Most sites either accept the censored source or rely on
              hand-painted decensored edits that take months to produce. We
              run every episode through an in-house pipeline built on
              <span className="font-mono"> video2x</span> and
              <span className="font-mono"> Real-CUGAN</span> that reconstructs
              the censored regions frame by frame, then stitches the
              decensored scenes back into the original episode at 1080p and
              4K. The result is the closest thing to the uncensored animation
              that exists, with picture quality that matches — and in many
              cases exceeds — the broadcast source.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Streaming and downloads
            </h2>
            <p>
              All playback uses adaptive-bitrate HLS so the player can switch
              between 720p, 1080p, and 4K on the fly without buffering. Master
              playlists live behind a Cloudflare R2 CDN with a custom Worker
              that gates MKV downloads behind HMAC-signed one-time URLs —
              there is no shared third-party file host, no redirect chain,
              and no waiting page. Free accounts get five downloads per day;
              premium accounts get unlimited downloads at full link speed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Catalog and discovery
            </h2>
            <p>
              The catalog covers AI-uncensored hentai, originally-uncensored
              releases, and a small number of censored episodes kept for
              completeness. Browse by{" "}
              <Link href="/genres" className="text-primary hover:underline">
                genre
              </Link>
              ,{" "}
              <Link href="/studios" className="text-primary hover:underline">
                studio
              </Link>
              , or{" "}
              <Link
                href="/public-playlists"
                className="text-primary hover:underline"
              >
                community playlist
              </Link>
              , or jump straight into the full filterable{" "}
              <Link href="/search" className="text-primary hover:underline">
                search
              </Link>{" "}
              page. New episodes are added regularly — typically several per
              week as soon as the decensoring pass and quality-control review
              complete.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">Contact</h2>
            <p>
              Questions, requests, or takedown notices:{" "}
              <a
                href="mailto:connect.hentaiclick@gmail.com"
                className="text-primary hover:underline"
              >
                connect.hentaiclick@gmail.com
              </a>
              . See the{" "}
              <Link href="/faq" className="text-primary hover:underline">
                FAQ
              </Link>{" "}
              for common questions about accounts, downloads, and the AI
              uncensoring pipeline.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
