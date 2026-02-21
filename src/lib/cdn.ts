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
