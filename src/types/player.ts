import type { Quality } from "@/lib/constants";

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  quality: Quality | "auto";
  playbackSpeed: number;
  subtitlesEnabled: boolean;
  subtitleTrack: string | null;
  audioTrack: number;
  loading: boolean;
  error: string | null;
}

export interface PlayerPreferences {
  preferredQuality: Quality | "auto";
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  subtitlesEnabled: boolean;
  preferredSubtitleLang: string;
  preferredAudioLang: string;
}

export const DEFAULT_PREFERENCES: PlayerPreferences = {
  preferredQuality: "auto",
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,
  subtitlesEnabled: false,
  preferredSubtitleLang: "en",
  preferredAudioLang: "ja",
};

export function loadPreferences(): PlayerPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const stored = localStorage.getItem("player_preferences");
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: Partial<PlayerPreferences>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadPreferences();
    localStorage.setItem(
      "player_preferences",
      JSON.stringify({ ...current, ...prefs })
    );
  } catch {}
}
