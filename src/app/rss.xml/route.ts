import { NextResponse } from "next/server";
import { getAnonClient } from "@/lib/supabase/anon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RSS 2.0 feed of the latest 50 published episodes.
//
// Why this exists:
//   - AI engines (Perplexity, You.com, etc.) and feed-aggregator-class
//     crawlers poll RSS for fresh content far more aggressively than
//     they refresh sitemaps. A new episode uploaded at 10:00 UTC will
//     show up in those engines within minutes via RSS, vs. hours-to-days
//     via sitemap re-crawl.
//   - Auto-discovery is wired in the root layout (<link rel="alternate"
//     type="application/rss+xml" href="/rss.xml" />) so browsers,
//     readers, and IDEs find it without user action.
//   - The footer also surfaces it as a visible link.
//
// Cache strategy:
//   - s-maxage=300 / SWR=3600 on the edge. New uploads propagate
//     within 5 minutes; the SWR window keeps things instant for
//     readers polling on their own cadence.
//   - Last-Modified header from the most recent upload_date so
//     conditional-GET-aware clients can skip the body entirely.

interface FeedEpisode {
  slug: string;
  title: string;
  upload_date: string | null;
  updated_at: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  meta_description: string | null;
  description: string | null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(iso: string | null | undefined): string {
  if (!iso) return new Date().toUTCString();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://hentaiclick.tv";

  const supabase = getAnonClient();
  const { data, error } = await supabase
    .from("episodes")
    .select(
      "slug, title, upload_date, updated_at, poster_url, thumbnail_url, meta_description, description"
    )
    .eq("status", "published")
    .order("upload_date", { ascending: false })
    .limit(50);

  if (error) {
    // Fail soft so a transient Supabase blip doesn't 500 the feed
    // endpoint and break every subscriber's reader. Return an empty
    // (but valid) RSS doc with a short cache window instead.
    const emptyBody = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>HentaiClick — Latest Uncensored Hentai</title>
  <link>${siteUrl}</link>
  <description>Latest AI-uncensored hentai episodes added to HentaiClick.</description>
  <language>en-us</language>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
</channel>
</rss>`;
    return new NextResponse(emptyBody, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const episodes = (data ?? []) as FeedEpisode[];

  const newestIso = episodes[0]?.upload_date ?? null;
  const lastBuildDate = toRfc822(newestIso);
  const lastModifiedHeader = toRfc822(newestIso);

  const items = episodes
    .map((ep) => {
      const link = `${siteUrl}/episode/${ep.slug}`;
      const pub = toRfc822(ep.upload_date);
      // Posters are stored with literal spaces (schema convention); a
      // literal space in an XML URL attribute is invalid per RFC 3986
      // and strict RSS readers reject the whole item. Same encodeURI
      // approach we already use in the sitemap.
      const rawThumb = ep.poster_url || ep.thumbnail_url || "";
      const thumb = rawThumb ? encodeURI(rawThumb) : "";
      const rawDesc =
        ep.meta_description ||
        ep.description ||
        `Watch ${ep.title} in HD on HentaiClick.`;
      const desc = rawDesc.replace(/\s+/g, " ").trim().slice(0, 400);
      return `  <item>
    <title>${escapeXml(ep.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="true">${escapeXml(link)}</guid>
    <pubDate>${pub}</pubDate>
    <description><![CDATA[${desc}]]></description>${
        thumb
          ? `
    <media:thumbnail url="${escapeXml(thumb)}" />
    <enclosure url="${escapeXml(thumb)}" type="image/webp" length="0" />`
          : ""
      }
  </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>HentaiClick — Latest Uncensored Hentai</title>
  <link>${siteUrl}</link>
  <description>Latest AI-uncensored hentai episodes added to HentaiClick. Stream in 4K, 1080p, and HD with English subtitles.</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Edge cache: 5 min hard, 1 hour SWR. New uploads surface within
      // 5 minutes globally, and readers polling on their own schedule
      // get an instant response from cache.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "Last-Modified": lastModifiedHeader,
    },
  });
}
