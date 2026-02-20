import { CDN_STREAM_BASE, CDN_DOWNLOAD_BASE, type Quality } from "./constants";

/**
 * Get HLS stream URL for an episode at a given quality.
 * Pattern: {CDN_STREAM_BASE}/{cdn_slug}/{quality}/index.m3u8
 */
export function getStreamUrl(cdnSlug: string, quality: Quality): string {
  return `${CDN_STREAM_BASE}/${cdnSlug}/${quality}/index.m3u8`;
}

/**
 * Get HLS subtitle track URL.
 * Pattern: {CDN_STREAM_BASE}/{cdn_slug}/{quality}/index_vtt.m3u8
 */
export function getSubtitleUrl(cdnSlug: string, quality: Quality): string {
  return `${CDN_STREAM_BASE}/${cdnSlug}/${quality}/index_vtt.m3u8`;
}

/**
 * Get thumbnail sprite VTT URL (always 720p).
 * Pattern: {CDN_STREAM_BASE}/{cdn_slug}/720/thumbs/thumbs.vtt
 */
export function getThumbsUrl(cdnSlug: string): string {
  return `${CDN_STREAM_BASE}/${cdnSlug}/720/thumbs/thumbs.vtt`;
}

/**
 * Get download URL for an episode.
 * Pattern: {CDN_DOWNLOAD_BASE}/{download_cdn_slug}/{download_filename}-{quality}p.mkv
 */
export function getDownloadUrl(
  downloadCdnSlug: string,
  downloadFilename: string,
  quality: Quality
): string {
  return `${CDN_DOWNLOAD_BASE}/${downloadCdnSlug}/${downloadFilename}-${quality}p.mkv`;
}
