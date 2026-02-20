import { CDN_STREAM_BASE, CDN_DOWNLOAD_BASE, type Quality } from "./constants";

/**
 * Get HLS stream URL for an episode at a given quality.
 * streamPath is the base folder, e.g. "natsu-no-hako-01"
 * Result: {CDN_STREAM_BASE}/{streamPath}/{quality}/index.m3u8
 */
export function getStreamUrl(streamPath: string, quality: Quality): string {
  return `${CDN_STREAM_BASE}/${streamPath}/${quality}/index.m3u8`;
}

/**
 * Get HLS subtitle track URL.
 * Result: {CDN_STREAM_BASE}/{streamPath}/{quality}/index_vtt.m3u8
 */
export function getSubtitleUrl(streamPath: string, quality: Quality): string {
  return `${CDN_STREAM_BASE}/${streamPath}/${quality}/index_vtt.m3u8`;
}

/**
 * Get thumbnail sprite VTT URL (always 720p).
 * Result: {CDN_STREAM_BASE}/{streamPath}/720/thumbs/thumbs.vtt
 */
export function getThumbsUrl(streamPath: string): string {
  return `${CDN_STREAM_BASE}/${streamPath}/720/thumbs/thumbs.vtt`;
}

/**
 * Get direct CDN download URL.
 * downloadPath is "folder/filename-base", e.g. "natsu-to-haku-01/Natsu-to-Hako-01"
 * Result: {CDN_DOWNLOAD_BASE}/{downloadPath}-{quality}p.mkv
 */
export function getDownloadUrl(
  downloadPath: string,
  quality: Quality
): string {
  return `${CDN_DOWNLOAD_BASE}/${downloadPath}-${quality}p.mkv`;
}