import { CDN_STREAM_BASE, CDN_DOWNLOAD_BASE, type Quality } from "./constants";

/**
 * If the value is already a full URL, return as-is.
 * Otherwise prepend the given CDN base.
 */
function resolveUrl(base: string, value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${base}/${value}`;
}

/**
 * Get full stream URL by looking up the quality in stream_links.
 * Returns null if no link exists for the given quality.
 */
export function getStreamUrl(
  streamLinks: Record<string, string>,
  quality: Quality
): string | null {
  const path = streamLinks[String(quality)];
  if (!path?.trim()) return null;
  return resolveUrl(CDN_STREAM_BASE, path);
}

/**
 * Get full subtitle URL by looking up the quality in subtitle_links.
 * Returns null if no subtitle link exists for the given quality.
 */
export function getSubtitleUrl(
  subtitleLinks: Record<string, string>,
  quality: Quality
): string | null {
  const path = subtitleLinks[String(quality)];
  if (!path?.trim()) return null;
  return resolveUrl(CDN_STREAM_BASE, path);
}

/**
 * Get full thumbnail VTT URL from the single thumbnail_path.
 * Returns null if no thumbnail path is set.
 */
export function getThumbsUrl(thumbnailPath: string): string | null {
  if (!thumbnailPath?.trim()) return null;
  return resolveUrl(CDN_STREAM_BASE, thumbnailPath);
}

/**
 * Get full download URL by looking up the quality in download_links.
 * Returns null if no download link exists for the given quality.
 */
export function getDownloadUrl(
  downloadLinks: Record<string, string>,
  quality: Quality
): string | null {
  const path = downloadLinks[String(quality)];
  if (!path?.trim()) return null;
  return resolveUrl(CDN_DOWNLOAD_BASE, path);
}

/**
 * Derive available streaming qualities from stream_links keys.
 * Returns sorted Quality[] from non-empty JSONB entries.
 */
export function deriveStreamQualities(
  streamLinks: Record<string, string>
): Quality[] {
  return Object.entries(streamLinks)
    .filter(([, v]) => v?.trim())
    .map(([k]) => Number(k))
    .filter((q): q is Quality => !isNaN(q))
    .sort((a, b) => a - b);
}

/**
 * Derive available download qualities from download_links keys.
 * Returns sorted Quality[] from non-empty JSONB entries.
 */
export function deriveDownloadQualities(
  downloadLinks: Record<string, string>
): Quality[] {
  return Object.entries(downloadLinks)
    .filter(([, v]) => v?.trim())
    .map(([k]) => Number(k))
    .filter((q): q is Quality => !isNaN(q))
    .sort((a, b) => a - b);
}

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  ru: "Russian",
};

/**
 * Detect if subtitle_links uses language keys (e.g. "en", "ja")
 * rather than numeric quality keys (e.g. "720", "1080").
 */
export function isMultiLangSubtitles(links: Record<string, string>): boolean {
  return Object.keys(links).some((k) => isNaN(Number(k)));
}

/**
 * Get all subtitle entries from subtitle_links, handling both formats:
 * - Multi-language: { "en": "path", "ja": "path" }
 * - Legacy quality-keyed: { "720": "path", "1080": "path" } → single "English" entry
 */
export function getSubtitleEntries(
  links: Record<string, string>
): { lang: string; label: string; url: string }[] {
  if (isMultiLangSubtitles(links)) {
    return Object.entries(links)
      .filter(([, v]) => v?.trim())
      .map(([lang, path]) => ({
        lang,
        label: LANGUAGE_LABELS[lang] ?? lang.toUpperCase(),
        url: resolveUrl(CDN_STREAM_BASE, path),
      }));
  }
  // Legacy format: use lowest quality path (most reliable for VTT segments).
  // Higher quality paths may share the same VTTs or have missing segments.
  const sorted = Object.entries(links)
    .filter(([, v]) => v?.trim())
    .sort(([a], [b]) => Number(a) - Number(b));
  if (sorted.length === 0) return [];
  const path = sorted[0][1];
  return [
    {
      lang: "en",
      label: "English",
      url: resolveUrl(CDN_STREAM_BASE, path),
    },
  ];
}
