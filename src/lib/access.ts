import {
  FOUR_K_UNLOCK_DAYS,
  FREE_USER_4K_DAILY_LIMIT,
  type Quality,
} from "./constants";
import type { UserContext } from "@/types";

/**
 * Get the list of qualities a user can stream for a given episode.
 */
export function getStreamableQualities(
  availableQualities: number[],
  userContext: UserContext,
  uploadDate: string
): Quality[] {
  const { role, isPremium } = userContext;

  // Admin, mod, or premium — all available qualities
  if (role === "admin" || role === "moderator" || isPremium) {
    return availableQualities as Quality[];
  }

  const daysSinceUpload = Math.floor(
    (Date.now() - new Date(uploadDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return availableQualities.filter((q) => {
    if (q <= 1080) return true;
    // 4K: free users after FOUR_K_UNLOCK_DAYS, guests never
    if (q === 2160) {
      if (role === "guest") return false;
      return daysSinceUpload >= FOUR_K_UNLOCK_DAYS;
    }
    return false;
  }) as Quality[];
}

/**
 * Get the list of qualities a user can download for a given episode.
 */
export function getDownloadableQualities(
  availableQualities: number[],
  userContext: UserContext,
  uploadDate: string,
  dailyDownloads4K: number = 0
): { quality: Quality; locked: boolean; reason?: string }[] {
  const { role, isPremium } = userContext;

  return availableQualities.map((q) => {
    const quality = q as Quality;

    // Premium, admin, mod — everything unlocked
    if (role === "admin" || role === "moderator" || isPremium) {
      return { quality, locked: false };
    }

    // Guest: only 1080p with Turnstile
    if (role === "guest") {
      if (quality <= 1080) {
        return { quality, locked: false };
      }
      return {
        quality,
        locked: true,
        reason: "Log in to download this quality",
      };
    }

    // Free user
    if (quality <= 1080) {
      return { quality, locked: false };
    }

    // 4K for free user
    if (quality === 2160) {
      const daysSinceUpload = Math.floor(
        (Date.now() - new Date(uploadDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpload < FOUR_K_UNLOCK_DAYS) {
        return {
          quality,
          locked: true,
          reason: `4K downloads available ${FOUR_K_UNLOCK_DAYS - daysSinceUpload} days after upload`,
        };
      }

      if (dailyDownloads4K >= FREE_USER_4K_DAILY_LIMIT) {
        return {
          quality,
          locked: true,
          reason: `Daily 4K download limit reached (${FREE_USER_4K_DAILY_LIMIT}/day)`,
        };
      }

      return { quality, locked: false };
    }

    return { quality, locked: false };
  });
}

/**
 * Check if a guest needs Turnstile verification for downloads.
 */
export function needsTurnstile(userContext: UserContext): boolean {
  return userContext.role === "guest";
}
