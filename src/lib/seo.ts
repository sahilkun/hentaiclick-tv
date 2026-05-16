// Shared helpers for per-page openGraph + twitter metadata.
//
// Why this exists: Next.js 16's metadata system DOES NOT deep-merge
// sibling fields inside a child `openGraph` block. When a child page or
// `generateMetadata` returns `openGraph: { title, description, url }`,
// the parent layout's `openGraph.siteName`, `images`, `locale`, and
// `type` are all dropped from the rendered <head>. Result: a page with
// title + description but no `og:image` / `og:site_name`, which renders
// as a generic untitled card when shared on Facebook, LinkedIn, Discord,
// iMessage, etc. Pre-fix every internal page (/faq, /about, /genres,
// /studios, /genres/[slug], /studios/[slug]) was hitting this. Same
// behaviour applies to `twitter` — child overrides drop the parent's
// `twitter:image`.
//
// These helpers re-emit the full shape every time, so a page that wants
// per-page title/description never accidentally loses the social-image
// preview.

import type { Metadata } from "next";

const SITE_NAME = "HentaiClick";

// Default 1424x752 site image. Non-standard dimensions but it matches
// our existing /og-image.png asset; resizing the source would need a
// new render and lose the existing share-cache. Twitter (1200x675) and
// Facebook (1200x630) both downscale it cleanly.
const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1424,
  height: 752,
  alt: "HentaiClick — watch AI uncensored hentai in 4K HD",
};

export interface OgImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function buildOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  /** Override the default site OG image (e.g. episode poster, studio logo). */
  image?: OgImage;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: opts.title,
    description: opts.description,
    url: opts.url,
    images: [opts.image ?? DEFAULT_OG_IMAGE],
  };
}

export function buildTwitter(opts: {
  title: string;
  description: string;
  /** Override the default site image. Pass a full URL or relative path. */
  image?: string;
}): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: opts.title,
    description: opts.description,
    images: [opts.image ?? DEFAULT_OG_IMAGE.url],
  };
}
