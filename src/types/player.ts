import type { Quality } from "@/lib/constants";

export interface AudioTrackInfo {
  id: number;
  name: string;
  lang: string;
}

export interface SubtitleTrackInfo {
  id: string;
  label: string;
  lang: string;
  url: string;
}

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
  availableAudioTracks: AudioTrackInfo[];
  availableSubtitles: SubtitleTrackInfo[];
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
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;

    return {
      preferredQuality:
        typeof parsed.preferredQuality === "number" || parsed.preferredQuality === "auto"
          ? parsed.preferredQuality
          : DEFAULT_PREFERENCES.preferredQuality,
      playbackSpeed:
        typeof parsed.playbackSpeed === "number"
          ? parsed.playbackSpeed
          : DEFAULT_PREFERENCES.playbackSpeed,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_PREFERENCES.volume,
      isMuted:
        typeof parsed.isMuted === "boolean"
          ? parsed.isMuted
          : DEFAULT_PREFERENCES.isMuted,
      subtitlesEnabled:
        typeof parsed.subtitlesEnabled === "boolean"
          ? parsed.subtitlesEnabled
          : DEFAULT_PREFERENCES.subtitlesEnabled,
      preferredSubtitleLang:
        typeof parsed.preferredSubtitleLang === "string"
          ? parsed.preferredSubtitleLang
          : DEFAULT_PREFERENCES.preferredSubtitleLang,
      preferredAudioLang:
        typeof parsed.preferredAudioLang === "string"
          ? parsed.preferredAudioLang
          : DEFAULT_PREFERENCES.preferredAudioLang,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
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
