export const CDN_STREAM_BASE =
  process.env.NEXT_PUBLIC_CDN_STREAM_BASE || "https://c6149z6464.r-cdn.com";
export const CDN_DOWNLOAD_BASE =
  process.env.NEXT_PUBLIC_CDN_DOWNLOAD_BASE || "https://c6149z6465.r-cdn.com";

export const QUALITY_LEVELS = [480, 720, 1080, 2160] as const;
export type Quality = (typeof QUALITY_LEVELS)[number];

export const QUALITY_LABELS: Record<Quality, string> = {
  480: "480p",
  720: "720p",
  1080: "1080p",
  2160: "4K",
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const FOUR_K_UNLOCK_DAYS = 7;
export const FREE_USER_4K_DAILY_LIMIT = 3;
export const VIEW_DEDUP_MINUTES = 30;
export const VIEW_COUNT_TRIGGER_SECONDS = 30;

export const SEARCH_DEBOUNCE_MS = 200;
export const SEARCH_DROPDOWN_LIMIT = 8;
export const SEARCH_PAGE_SIZE = 25;

export const COMMENT_MAX_LENGTH = 2000;
export const COMMENT_MAX_NESTING = 2;

export const WATCH_HISTORY_MAX_ENTRIES = 100;

export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const SITE_NAME = "HentaiClick TV";
export const SITE_DESCRIPTION =
  "Watch the highest quality hentai in 4K, 1080p, and HD for free.";
