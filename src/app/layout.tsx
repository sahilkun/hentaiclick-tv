import Script from "next/script";
import { safeJsonLd } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { DevToolsGuard } from "@/components/providers/devtools-guard";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Note: child pages that set their own `openGraph` block REPLACE this
// one entirely (Next.js does not deep-merge siblings inside openGraph).
// Use the helpers in `@/lib/seo` (`buildOpenGraph`, `buildTwitter`) so
// every per-page block keeps siteName, type, locale, images intact.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Watch AI Uncensored Hentai in 4K HD — HentaiClick",
    template: "%s | HentaiClick",
  },
  description:
    "Watch and download AI uncensored hentai in 4K, 1080p, and HD on HentaiClick. Stream new decensored episodes free with English subtitles. New releases daily.",
  openGraph: {
    type: "website",
    siteName: "HentaiClick",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1424, height: 752 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to the CDN actually used for streams, images, and downloads */}
        <link rel="preconnect" href="https://cdn.hentaiclick.tv" crossOrigin="anonymous" />
        {/* Supabase preconnect omitted — self-hosted on hentaiclick.tv (same-origin, no benefit) */}
        {/* RSS auto-discovery. Browsers and feed readers look for this
            in <head> to surface a "subscribe" UI. AI engines that
            poll feeds for fresh content (Perplexity, etc.) also key
            off this link rather than crawling for /rss.xml blindly. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="HentaiClick — Latest Episodes"
          href="/rss.xml"
        />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-J245QRXDYG" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {"window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-J245QRXDYG');"}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <DevToolsGuard />
              <SiteGraphJsonLd />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Site-wide WebSite + Organization JSON-LD, emitted once per page from
 * the root layout.
 *
 * - WebSite + potentialAction SearchAction: tells Google the canonical
 *   site search URL pattern, which unlocks the SERP sitelinks search
 *   box on brand queries.
 * - Organization: gives Google + AI engines a clean entity to bind
 *   facts to ("HentaiClick is a streaming site for…").
 *
 * Both nodes use `${siteUrl}/#website` and `${siteUrl}/#organization`
 * as their @ids. Other pages (FAQPage, AboutPage, CollectionPage)
 * reference these IDs via `isPartOf` / `about` so the structured-data
 * graph stays connected. Don't change the @id format without updating
 * those references.
 *
 * Prior version emitted only `name + url` on Organization and `name +
 * url + SearchAction` on WebSite. Enriched here with description /
 * inLanguage / knowsAbout so AI engines have something quotable to
 * extract for the "what is HentaiClick" query class. Used to be
 * duplicated on the homepage; consolidated here to avoid two
 * conflicting WebSite entities in Google's graph.
 */
function SiteGraphJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "HentaiClick",
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
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "HentaiClick",
        description:
          "Watch and download AI uncensored hentai in 4K, 1080p, and HD on HentaiClick. Stream new decensored episodes free with English subtitles.",
        inLanguage: "en-US",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}
