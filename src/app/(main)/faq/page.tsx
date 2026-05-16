import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { safeJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ — HentaiClick",
  description:
    "Frequently asked questions about HentaiClick: streaming quality, AI uncensoring, downloads, subtitles, accounts, and how new uncensored hentai episodes are added.",
  openGraph: {
    title: "FAQ — HentaiClick",
    description:
      "Answers to the most common questions about watching, downloading, and AI-uncensored hentai on HentaiClick.",
    url: "/faq",
  },
  alternates: { canonical: "/faq" },
};

// AEO/GEO play: a structured FAQ doc is the format answer engines
// (ChatGPT, Claude, Perplexity, Google AI Overviews) prefer when picking
// citations. Pair the visible <details> blocks with FAQPage JSON-LD so
// both human readers and machine consumers see the same Q/A pairs.
//
// Question selection was driven by real query intents we want to win on:
// "is hentaiclick free", "what is ai uncensored hentai", "download
// uncensored hentai", "hentai with english subtitles", etc. Every answer
// is short, confident, and standalone — no "see other pages" references —
// because AI engines often quote a single answer block out of context.
const siteUrl = "https://hentaiclick.tv";

type Faq = { q: string; a: string };

const faqs: Faq[] = [
  {
    q: "What is HentaiClick?",
    a: "HentaiClick is a free streaming and download site for AI-uncensored hentai. Every episode is available in 4K, 1080p, and HD with English subtitles, and most releases come with a downloadable 1080p or 4K MKV.",
  },
  {
    q: "Is HentaiClick free to use?",
    a: "Yes. Streaming any episode is free with no signup required. A free account unlocks watch history, favorites, and five MKV downloads per day. Premium adds unlimited downloads and uninterrupted 4K access.",
  },
  {
    q: "What does \"AI uncensored\" mean?",
    a: "Japanese hentai releases ship with mosaic censorship by law. We run every episode through an in-house AI decensoring pipeline (video2x + Real-CUGAN) that reconstructs the censored regions frame by frame, then stitches the decensored scenes back into the original episode at 1080p and 4K.",
  },
  {
    q: "What is the difference between \"AI uncensored\" and \"uncensored\" hentai?",
    a: "\"Uncensored\" episodes were animated without any mosaic in the first place — usually special studio releases. \"AI uncensored\" episodes started life censored and had the mosaic removed by our AI pipeline. The end result looks similar, but the source is different. Both are tagged separately so you can filter for either.",
  },
  {
    q: "What video qualities are available?",
    a: "Every episode streams adaptive-bitrate HLS at 720p, 1080p, and 4K (2160p). You can pick a fixed quality from the player menu or let the player auto-select based on your connection. Downloads are offered in 1080p and 4K MKV.",
  },
  {
    q: "Can I download episodes for offline viewing?",
    a: "Yes. Hit the Download button on any episode to grab the full AI-uncensored MKV in 1080p or 4K. Downloads use one-time signed URLs that stream straight to your browser — no waiting, no ads, no redirects. Free accounts get five downloads per day; premium gets unlimited.",
  },
  {
    q: "Do episodes have English subtitles?",
    a: "Yes. Every episode includes embedded English subtitles delivered through the HLS playlist. Toggle them on or off from the player's CC button. Japanese subtitle tracks are also available where the source provided them.",
  },
  {
    q: "How often are new uncensored hentai episodes added?",
    a: "New episodes are added regularly — typically several per week as soon as the AI decensoring pass completes and quality-control review passes. Check the homepage \"Recently Uploaded\" tab for the latest releases or follow a specific studio or series page.",
  },
  {
    q: "Do I need an account to watch?",
    a: "No. Streaming and basic browsing work without an account. You only need to sign in if you want to download MKVs, save favorites, sync watch progress across devices, or build playlists.",
  },
  {
    q: "How do I find a specific hentai series or episode?",
    a: "Use the search page to filter by genre, studio, series, or keyword. You can also browse the full genre list, the studio directory, or public playlists curated by other users. Episode and series titles support both English romaji and original Japanese script.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${siteUrl}/faq#faqpage`,
  url: `${siteUrl}/faq`,
  inLanguage: "en-US",
  isPartOf: { "@id": `${siteUrl}#website` },
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "FAQ",
      item: `${siteUrl}/faq`,
    },
  ],
};

export default function FaqPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb. Tiny visible echo of the JSON-LD breadcrumb above —
            useful for both users and as a secondary signal to crawlers. */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              FAQ
            </li>
          </ol>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Everything you need to know about watching, downloading, and the
          AI uncensoring pipeline behind every episode on {SITE_NAME}. Tap a
          question to expand the answer.
        </p>

        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-lg border border-border bg-card px-5 py-4 open:bg-card/80"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  <span>{f.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Question not answered here?{" "}
          <a
            href="mailto:connect.hentaiclick@gmail.com"
            className="text-primary hover:underline"
          >
            connect.hentaiclick@gmail.com
          </a>
          .
        </div>
      </section>
    </div>
  );
}
