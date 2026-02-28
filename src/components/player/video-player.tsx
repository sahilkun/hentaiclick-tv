"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { getStreamUrl, getThumbsUrl, getSubtitleEntries, LANGUAGE_LABELS } from "@/lib/cdn";
import type { Quality } from "@/lib/constants";
import {
  loadPreferences,
  savePreferences,
  type PlayerState,
  type AudioTrackInfo,
  type SubtitleTrackInfo,
} from "@/types/player";
import { PlayerControls } from "./player-controls";
import { PlayerToast } from "./player-toast";

export interface ThumbCue {
  start: number;
  end: number;
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function parseVttThumbs(vttText: string, baseUrl: string): ThumbCue[] {
  const cues: ThumbCue[] = [];
  // Normalize CRLF → LF before splitting
  const normalized = vttText.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    const urlLine = lines.find(
      (l) =>
        (l.includes(".jpg") || l.includes(".png") || l.includes(".webp")) &&
        !l.includes("-->")
    );
    if (!timeLine || !urlLine) continue;

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    const start = parseVttTime(startStr);
    const end = parseVttTime(endStr);

    // Skip invalid cues (end <= start)
    if (end <= start) continue;

    const hashIdx = urlLine.indexOf("#xywh=");
    let url: string;
    let x = 0,
      y = 0,
      w = 160,
      h = 90;
    if (hashIdx !== -1) {
      const path = urlLine.substring(0, hashIdx).trim();
      url = path.startsWith("http") ? path : `${baseUrl}/${path}`;
      const coords = urlLine.substring(hashIdx + 6).split(",").map(Number);
      [x, y, w, h] = coords;
    } else {
      const path = urlLine.trim();
      url = path.startsWith("http") ? path : `${baseUrl}/${path}`;
    }

    cues.push({ start, end, url, x, y, w, h });
  }
  return cues;
}

function parseVttTime(str: string): number {
  const parts = str.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return Number(m) * 60 + parseFloat(s);
  }
  return parseFloat(str);
}

/**
 * Parse an HLS m3u8 playlist and fetch all VTT segments, returning
 * a concatenated VTT blob URL that can be used as a <track> src.
 */
async function loadSubtitleVtt(
  subtitleM3u8Url: string
): Promise<string | null> {
  try {
    const res = await fetch(subtitleM3u8Url);
    if (!res.ok) return null;
    const text = await res.text();

    // Parse segment filenames from the m3u8
    const segmentNames = text
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));

    if (segmentNames.length === 0) return null;

    const baseUrl = subtitleM3u8Url.substring(
      0,
      subtitleM3u8Url.lastIndexOf("/")
    );

    // Fetch all VTT segments in parallel
    const segmentPromises = segmentNames.map((name) =>
      fetch(`${baseUrl}/${name.trim()}`).then((r) =>
        r.ok ? r.text() : ""
      )
    );
    const segments = await Promise.all(segmentPromises);

    // Concatenate: keep WEBVTT header from first segment, strip from rest
    let combined = "";
    for (let i = 0; i < segments.length; i++) {
      // Normalize CRLF → LF
      const seg = segments[i].replace(/\r\n/g, "\n").trim();
      if (!seg) continue;
      if (i === 0) {
        combined = seg;
      } else {
        // Remove WEBVTT header line and any NOTE/STYLE blocks from subsequent segments
        const lines = seg.split("\n");
        const startIdx = lines.findIndex(
          (l, idx) => idx > 0 && l.includes("-->")
        );
        if (startIdx > 0) {
          // Include the line before --> (the cue identifier, if any)
          const cueStart = lines[startIdx - 1]?.trim()
            ? startIdx - 1
            : startIdx;
          combined += "\n\n" + lines.slice(cueStart).join("\n");
        }
      }
    }

    const blob = new Blob([combined], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

interface VideoPlayerProps {
  streamLinks: Record<string, string>;
  subtitleLinks: Record<string, string>;
  thumbnailPath: string;
  availableQualities: Quality[];
  allowedQualities: Quality[];
  onView?: () => void;
  onFirstPlay?: () => void;
  className?: string;
}

export function VideoPlayer({
  streamLinks,
  subtitleLinks,
  thumbnailPath,
  availableQualities,
  allowedQualities,
  onView,
  onFirstPlay,
  className,
}: VideoPlayerProps) {
  // Stable key for streamLinks to use as useEffect dependency
  const streamLinksKey = useMemo(
    () => Object.entries(streamLinks).sort().map(([k, v]) => `${k}:${v}`).join("|"),
    [streamLinks]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewCountedRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playTimeRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);
  const retryCountRef = useRef(0);
  const currentQualityRef = useRef<Quality>(720);
  const subtitleBlobUrlRef = useRef<string | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setupGenRef = useRef(0);
  const MAX_RETRIES = 3;

  const [toast, setToast] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [thumbCues, setThumbCues] = useState<ThumbCue[]>([]);
  const firstPlayFiredRef = useRef(false);
  const [state, setState] = useState<PlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    fullscreen: false,
    quality: "auto",
    playbackSpeed: 1,
    subtitlesEnabled: true,
    subtitleTrack: null,
    audioTrack: 0,
    availableAudioTracks: [],
    availableSubtitles: [],
    loading: true,
    error: null,
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }, []);

  // Core HLS setup function — stored in a ref so it's always current
  // but never causes re-renders or effect re-runs
  const setupHlsRef = useRef<
    (video: HTMLVideoElement, quality: Quality, restoreTime?: number) => void
  >(() => {});

  setupHlsRef.current = (
    video: HTMLVideoElement,
    quality: Quality,
    restoreTime?: number
  ) => {
    hlsRef.current?.destroy();
    retryCountRef.current = 0;
    currentQualityRef.current = quality;

    // Bump generation so stale async subtitle loads are ignored
    const gen = ++setupGenRef.current;

    // Clean up old subtitle blob URL
    if (subtitleBlobUrlRef.current) {
      URL.revokeObjectURL(subtitleBlobUrlRef.current);
      subtitleBlobUrlRef.current = null;
    }
    // Remove existing track elements
    const existingTracks = video.querySelectorAll("track");
    existingTracks.forEach((t) => t.remove());

    const streamUrl = getStreamUrl(streamLinks, quality);
    if (!streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        capLevelOnFPSDrop: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 90,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;

      // Recommended order: attachMedia first, then loadSource on MEDIA_ATTACHED
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        setState((s) => ({ ...s, loading: false, error: null }));
        if (restoreTime !== undefined) {
          video.currentTime = restoreTime;
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        const tracks: AudioTrackInfo[] = hls.audioTracks.map((t, i) => ({
          id: i,
          name: LANGUAGE_LABELS[t.lang ?? ""] ?? t.name ?? `Track ${i + 1}`,
          lang: t.lang ?? `track-${i}`,
        }));
        setState((s) => ({ ...s, availableAudioTracks: tracks }));
        const prefs = loadPreferences();
        const preferred = hls.audioTracks.findIndex(
          (t) => t.lang === prefs.preferredAudioLang
        );
        if (preferred >= 0) hls.audioTrack = preferred;
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            retryCountRef.current++;
            if (retryCountRef.current <= MAX_RETRIES) {
              console.warn(
                `HLS network error, retrying (${retryCountRef.current}/${MAX_RETRIES})...`
              );
              setTimeout(
                () => hls.startLoad(),
                1000 * retryCountRef.current
              );
            } else {
              console.error("HLS network error: max retries reached");
              setState((s) => ({
                ...s,
                loading: false,
                error: "Video unavailable. The stream could not be loaded.",
              }));
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.warn("HLS media error, attempting recovery...");
            hls.recoverMediaError();
          } else {
            console.error("HLS fatal error:", data.type);
            setState((s) => ({
              ...s,
              loading: false,
              error: "An unexpected playback error occurred.",
            }));
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = streamUrl;
      video.addEventListener(
        "loadedmetadata",
        () => {
          setState((s) => ({ ...s, loading: false }));
          if (restoreTime !== undefined) {
            video.currentTime = restoreTime;
          }
        },
        { once: true }
      );
    }

    // Load thumbnails for seek preview
    const thumbsUrl = getThumbsUrl(thumbnailPath);
    if (thumbsUrl) {
      const baseUrl = thumbsUrl.substring(0, thumbsUrl.lastIndexOf("/"));
      fetch(thumbsUrl)
        .then((res) => (res.ok ? res.text() : Promise.reject()))
        .then((vttText) => setThumbCues(parseVttThumbs(vttText, baseUrl)))
        .catch(() => setThumbCues([]));
    } else {
      setThumbCues([]);
    }

    // Load subtitle tracks
    const entries = getSubtitleEntries(subtitleLinks);
    if (entries.length > 0) {
      const prefs = loadPreferences();
      const subtitleInfos: SubtitleTrackInfo[] = entries.map((e) => ({
        id: e.lang,
        label: e.label,
        lang: e.lang,
        url: e.url,
      }));
      setState((s) => ({ ...s, availableSubtitles: subtitleInfos }));

      // Load preferred language first (or first available)
      const preferred =
        entries.find((e) => e.lang === prefs.preferredSubtitleLang) ??
        entries[0];
      loadSubtitleVtt(preferred.url).then((blobUrl) => {
        if (gen !== setupGenRef.current) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          return;
        }
        if (!blobUrl) return;
        subtitleBlobUrlRef.current = blobUrl;
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = preferred.label;
        track.srclang = preferred.lang;
        track.src = blobUrl;
        track.default = true;
        video.appendChild(track);
        if (track.track) {
          track.track.mode = state.subtitlesEnabled ? "showing" : "hidden";
        }
        setState((s) => ({ ...s, subtitleTrack: preferred.lang }));
      });
    } else {
      setState((s) => ({ ...s, availableSubtitles: [] }));
    }
  };

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || Object.keys(streamLinks).length === 0) return;

    const prefs = loadPreferences();
    const defaultQuality =
      prefs.preferredQuality !== "auto" &&
      allowedQualities.includes(prefs.preferredQuality)
        ? prefs.preferredQuality
        : allowedQualities[allowedQualities.length - 1] ?? 720;

    setupHlsRef.current(video, defaultQuality as Quality);

    // Apply preferences
    video.volume = prefs.volume;
    video.muted = prefs.isMuted;
    video.playbackRate = prefs.playbackSpeed;
    setState((s) => ({
      ...s,
      volume: prefs.volume,
      muted: prefs.isMuted,
      playbackSpeed: prefs.playbackSpeed,
      quality: prefs.preferredQuality,
    }));

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      retryCountRef.current = 0;
      if (subtitleBlobUrlRef.current) {
        URL.revokeObjectURL(subtitleBlobUrlRef.current);
        subtitleBlobUrlRef.current = null;
      }
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = undefined;
      }
    };
  }, [streamLinksKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setState((s) => ({
        ...s,
        currentTime: video.currentTime,
        duration: video.duration || 0,
      }));

      if (!video.paused) {
        const now = performance.now() / 1000;
        if (lastTimeUpdateRef.current > 0) {
          const delta = Math.min(now - lastTimeUpdateRef.current, 1);
          playTimeRef.current += delta;
        }
        lastTimeUpdateRef.current = now;
        if (playTimeRef.current >= 30 && !viewCountedRef.current) {
          viewCountedRef.current = true;
          onView?.();
        }
      } else {
        lastTimeUpdateRef.current = 0;
      }
    };

    const onProgress = () => {
      if (video.buffered.length > 0) {
        setState((s) => ({
          ...s,
          buffered: video.buffered.end(video.buffered.length - 1),
        }));
      }
    };

    const onPlay = () => {
      if (!firstPlayFiredRef.current) { firstPlayFiredRef.current = true; onFirstPlay?.(); }
      setState((s) => ({ ...s, playing: true }));
    };
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onCanPlay = () => setState((s) => ({ ...s, loading: false }));
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: video.duration || 0 }));

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("durationchange", onDurationChange);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("durationchange", onDurationChange);
    };
  }, [onView]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "arrowleft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          showToast("-5s");
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + 5
          );
          showToast("+5s");
          break;
        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.05);
          setState((s) => ({ ...s, volume: video.volume }));
          savePreferences({ volume: video.volume });
          showToast(`Volume: ${Math.round(video.volume * 100)}%`);
          break;
        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.05);
          setState((s) => ({ ...s, volume: video.volume }));
          savePreferences({ volume: video.volume });
          showToast(`Volume: ${Math.round(video.volume * 100)}%`);
          break;
        case "m":
          video.muted = !video.muted;
          setState((s) => ({ ...s, muted: video.muted }));
          savePreferences({ isMuted: video.muted });
          showToast(video.muted ? "Muted" : "Unmuted");
          break;
        case "c":
          toggleSubtitles();
          break;
      }

      resetHideTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetHideTimer, showToast]);

  // Sync fullscreen state with browser via fullscreenchange event
  useEffect(() => {
    const onFullscreenChange = () => {
      setState((s) => ({ ...s, fullscreen: !!document.fullscreenElement }));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

  // YouTube-style click handling: delay single-click to distinguish from double-click
  const handleVideoClick = useCallback(() => {
    if (clickTimerRef.current) {
      // Second click arrived within window → double-click → fullscreen
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = undefined;
      toggleFullscreen();
    } else {
      // First click → wait to see if a second click follows
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = undefined;
        togglePlay();
      }, 250);
    }
  }, [toggleFullscreen, togglePlay]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = vol;
    video.muted = vol === 0;
    setState((s) => ({ ...s, volume: vol, muted: vol === 0 }));
    savePreferences({ volume: vol, isMuted: vol === 0 });
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setState((s) => ({ ...s, muted: video.muted }));
    savePreferences({ isMuted: video.muted });
  }, []);

  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = video.textTracks;
    if (tracks.length === 0) return;

    const newEnabled = !state.subtitlesEnabled;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = newEnabled ? "showing" : "hidden";
    }
    setState((s) => ({ ...s, subtitlesEnabled: newEnabled }));
    showToast(newEnabled ? "Subtitles ON" : "Subtitles OFF");
  }, [state.subtitlesEnabled, showToast]);

  const retryLoad = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    const prefs = loadPreferences();
    const defaultQuality =
      prefs.preferredQuality !== "auto" &&
      allowedQualities.includes(prefs.preferredQuality)
        ? prefs.preferredQuality
        : allowedQualities[allowedQualities.length - 1] ?? 720;

    setupHlsRef.current(video, defaultQuality as Quality);
  }, [allowedQualities]);

  const changeQuality = useCallback(
    (quality: Quality) => {
      const video = videoRef.current;
      if (!video) return;

      const currentTime = video.currentTime;
      const wasPlaying = !video.paused;

      setupHlsRef.current(video, quality, currentTime);

      // Resume playback after quality switch
      const hls = hlsRef.current;
      if (hls) {
        const onParsed = () => {
          if (wasPlaying) video.play();
          hls.off(Hls.Events.MANIFEST_PARSED, onParsed);
        };
        hls.on(Hls.Events.MANIFEST_PARSED, onParsed);
      }

      setState((s) => ({ ...s, quality, error: null }));
      savePreferences({ preferredQuality: quality });
      showToast(`Quality: ${quality}p`);
    },
    [showToast]
  );

  const changeSpeed = useCallback(
    (speed: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = speed;
      setState((s) => ({ ...s, playbackSpeed: speed }));
      savePreferences({ playbackSpeed: speed });
      showToast(`Speed: ${speed}x`);
    },
    [showToast]
  );

  const changeAudioTrack = useCallback(
    (trackIndex: number) => {
      const hls = hlsRef.current;
      if (!hls) return;
      hls.audioTrack = trackIndex;
      setState((s) => ({ ...s, audioTrack: trackIndex }));
      const lang = hls.audioTracks[trackIndex]?.lang;
      if (lang) savePreferences({ preferredAudioLang: lang });
      showToast(
        `Audio: ${hls.audioTracks[trackIndex]?.name ?? `Track ${trackIndex + 1}`}`
      );
    },
    [showToast]
  );

  const changeSubtitleTrack = useCallback(
    (lang: string | null) => {
      const video = videoRef.current;
      if (!video) return;

      // Remove existing track elements
      const existing = video.querySelectorAll("track");
      existing.forEach((t) => t.remove());
      if (subtitleBlobUrlRef.current) {
        URL.revokeObjectURL(subtitleBlobUrlRef.current);
        subtitleBlobUrlRef.current = null;
      }

      if (!lang) {
        setState((s) => ({
          ...s,
          subtitleTrack: null,
          subtitlesEnabled: false,
        }));
        showToast("Subtitles OFF");
        return;
      }

      const entry = state.availableSubtitles.find((sub) => sub.lang === lang);
      if (!entry) return;

      loadSubtitleVtt(entry.url).then((blobUrl) => {
        if (!blobUrl) return;
        subtitleBlobUrlRef.current = blobUrl;
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = entry.label;
        track.srclang = entry.lang;
        track.src = blobUrl;
        track.default = true;
        video.appendChild(track);
        if (track.track) track.track.mode = "showing";
        setState((s) => ({
          ...s,
          subtitleTrack: lang,
          subtitlesEnabled: true,
        }));
        savePreferences({ preferredSubtitleLang: lang });
        showToast(`Subtitles: ${entry.label}`);
      });
    },
    [state.availableSubtitles, showToast]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden bg-black",
        state.fullscreen ? "h-screen w-screen" : "aspect-video w-full",
        className
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (!videoRef.current?.paused) setControlsVisible(false);
      }}
    >
      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer"
        onClick={handleVideoClick}
        playsInline
      />

      {/* Loading spinner */}
      {state.loading && !state.error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}

      {/* Error overlay */}
      {state.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
          <TriangleAlert className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">{state.error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Play button overlay */}
      {!state.playing && !state.loading && !state.error && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <PlayerControls
          state={state}
          allowedQualities={allowedQualities}
          availableQualities={availableQualities}
          thumbCues={thumbCues}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onChangeQuality={changeQuality}
          onChangeSpeed={changeSpeed}
          onChangeAudioTrack={changeAudioTrack}
          onChangeSubtitleTrack={changeSubtitleTrack}
          onToggleFullscreen={toggleFullscreen}
          onToggleSubtitles={toggleSubtitles}
        />
      </div>

      {/* Toast */}
      <PlayerToast message={toast} />
    </div>
  );
}
