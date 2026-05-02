"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { getStreamUrl, getMasterUrl, getThumbsUrl, getSubtitleEntries, LANGUAGE_LABELS } from "@/lib/cdn";
import type { Quality } from "@/lib/constants";
import { useWatchProgress } from "@/hooks/use-watch-progress";
import {
  loadPreferences,
  savePreferences,
  type PlayerState,
  type AudioTrackInfo,
  type SubtitleTrackInfo,
} from "@/types/player";
import { PlayerControls } from "./player-controls";
import { PlayerToast } from "./player-toast";
import { parseVttThumbs, loadSubtitleVtt, type ThumbCue } from "@/lib/player/vtt";

export type { ThumbCue };

interface VideoPlayerProps {
  streamLinks: Record<string, string>;
  subtitleLinks: Record<string, string>;
  thumbnailPath: string;
  availableQualities: Quality[];
  allowedQualities: Quality[];
  onView?: () => void;
  onFirstPlay?: () => void;
  /** When true, the internal center play overlay is hidden (the parent shows its own poster overlay instead). */
  hidePlayOverlay?: boolean;
  /** Optional: when defined, surfaces the theater-mode toggle button in the controls. */
  theaterMode?: boolean;
  onToggleTheater?: () => void;
  /** Episode UUID. When present, the player periodically POSTs progress to the server. */
  episodeId?: string;
  /** If set (in seconds) the player seeks here on first manifest-parsed event. */
  initialPosition?: number;
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
  hidePlayOverlay,
  theaterMode,
  onToggleTheater,
  episodeId,
  initialPosition,
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
  const seekDraggingRef = useRef(false);
  const setupGenRef = useRef(0);
  const MAX_RETRIES = 3;

  const [toast, setToast] = useState<string | null>(null);
  // Thumbnail-sprite cell to overlay on the <video> while paused-and-seeking,
  // so the displayed frame matches the seekbar position even though hls.js
  // hasn't decoded the actual video frame yet. Cleared on `play`.
  const [pausedPreviewCue, setPausedPreviewCue] = useState<ThumbCue | null>(null);
  // Stable ref so the `seek` useCallback can read latest cues without
  // re-binding (and therefore without re-binding the props passed down to
  // PlayerControls on every cue change).
  const thumbCuesRef = useRef<ThumbCue[]>([]);
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

  // Cross-device watch-progress sync. No-op for anonymous users (server
  // returns 200 with `anonymous: true`). The hook handles its own
  // throttling, sendBeacon-on-unload, and bail-outs for short clips.
  useWatchProgress({
    episodeId,
    currentTime: state.currentTime,
    duration: state.duration,
    isPlaying: state.playing,
  });

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

    const streamUrl = getMasterUrl(streamLinks) ?? getStreamUrl(streamLinks, quality);
    if (!streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        capLevelOnFPSDrop: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 90,
        lowLatencyMode: false,
        // Append fragment data to the SourceBuffer as it streams in,
        // instead of waiting for the full segment to download. The very
        // first frame after a seek is therefore visible while the rest
        // of the segment is still arriving — matches the YouTube/Netflix
        // perception of "instant" seeks. Negligible cost; supported by
        // every browser that runs hls.js.
        progressive: true,
        // Default 0.25 means hls.js can return a fragment whose start is
        // up to 250ms BEFORE the requested time — useful for live but
        // wastes a bit on VOD seeks where we already know the keyframe
        // alignment. Setting to 0 makes the lookup pick the exact-or-
        // later frag, avoiding a backwards re-fetch.
        maxFragLookUpTolerance: 0,
        // Cap how long hls.js waits before declaring a fragment load
        // "stalled" and trying alternatives. Default ~4s. Cutting to 2s
        // means a slow CDN edge gets retried twice as fast, so the user
        // doesn'''t feel a multi-second hang on a single bad fetch.
        maxLoadingDelay: 2,
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
          name: t.name ?? LANGUAGE_LABELS[t.lang ?? ""] ?? `Track ${i + 1}`,
          lang: t.lang ?? `track-${i}`,
        }));
        setState((s) => ({ ...s, availableAudioTracks: tracks }));
        const prefs = loadPreferences();
        const preferred = hls.audioTracks.findIndex(
          (t) => t.lang === prefs.preferredAudioLang
        );
        if (preferred >= 0) hls.audioTrack = preferred;
      });

      // Populate subtitle tracks from HLS manifest (for master playlist)
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        const subs: SubtitleTrackInfo[] = hls.subtitleTracks.map((t, i) => ({
          id: t.lang ?? String(i),
          label: t.name ?? LANGUAGE_LABELS[t.lang ?? ""] ?? "Subtitles",
          lang: t.lang ?? String(i),
          url: "",
        }));
        if (subs.length > 0) {
          setState((s) => ({ ...s, availableSubtitles: subs, subtitleTrack: subs[0].lang, subtitlesEnabled: true }));
          hls.subtitleTrack = 0;
          hls.subtitleDisplay = true;
        }
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

    // Load subtitle tracks (skip if master playlist handles them)
    const usingMaster = !!getMasterUrl(streamLinks);
    const entries = getSubtitleEntries(subtitleLinks);
    if (entries.length > 0 && !usingMaster) {
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

  // Mirror thumb cues into a ref so the stable `seek` callback can read
  // the latest set without taking thumbCues as a dependency (which would
  // re-create every prop passed down to PlayerControls).
  useEffect(() => {
    thumbCuesRef.current = thumbCues;
  }, [thumbCues]);

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

    // Sanity-cap the resume position: if it's within the last 10s of the
    // video, don't bother resuming (the user finished it). Also clamp to
    // 0 so a negative value doesn't break HLS.
    const safeResume =
      typeof initialPosition === "number" &&
      initialPosition > 0 &&
      Number.isFinite(initialPosition)
        ? Math.max(0, initialPosition)
        : undefined;
    setupHlsRef.current(video, defaultQuality as Quality, safeResume);

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
      // NOTE: do NOT clear pausedPreviewCue here. `play` fires the moment
      // playback is requested, but hls.js still needs to fetch + decode
      // the segment at the seeked position. Clearing the overlay here
      // would briefly expose the stale <video> frame (the last frame
      // decoded BEFORE the seek). We clear in the `playing` handler
      // below instead, which fires when frames at the new position are
      // actually flowing.
    };
    const onPlaying = () => {
      // Real frames at the seeked position are now rendered — safe to
      // hide the thumbnail overlay.
      setPausedPreviewCue(null);
    };
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onCanPlay = () => setState((s) => ({ ...s, loading: false }));
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: video.duration || 0 }));

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("durationchange", onDurationChange);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("playing", onPlaying);
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
      if (videoRef.current && !videoRef.current.paused && !seekDraggingRef.current) {
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
          video.currentTime = Math.max(0, video.currentTime - 10);
          showToast("-10s");
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + 10
          );
          showToast("+10s");
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

  // Push subtitle cues up so they don't overlap with controls
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const MIN_LINE = -3; // floor - short text sits here
    const CHARS_PER_LINE = 45; // approximate chars before wrap

    const getLinePos = (text: string) => {
      // Count how many visual lines this text will take
      const cleanText = text.replace(/<[^>]*>/g, ""); // strip HTML tags
      const lines = Math.max(1, Math.ceil(cleanText.length / CHARS_PER_LINE));
      // Push up by extra lines so bottom never goes below MIN_LINE
      return MIN_LINE - (lines - 1);
    };

    const repositionAllCues = () => {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (!track.cues) continue;
        for (let j = 0; j < track.cues.length; j++) {
          const cue = track.cues[j] as VTTCue;
          const targetLine = getLinePos(cue.text);
          if (cue.line !== targetLine) {
            cue.line = targetLine;
            cue.snapToLines = true;
          }
        }
      }
    };

    // Reposition on every cue change
    const onCueChange = () => repositionAllCues();

    const onAddTrack = (e: TrackEvent) => {
      const track = e.track;
      if (!track) return;
      track.addEventListener("cuechange", onCueChange);
      // Poll for cues to load (HLS segments arrive async)
      const interval = setInterval(() => {
        if (track.cues && track.cues.length > 0) {
          repositionAllCues();
        }
      }, 200);
      setTimeout(() => clearInterval(interval), 10000);
    };

    // Handle existing tracks
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].addEventListener("cuechange", onCueChange);
    }
    video.textTracks.addEventListener("addtrack", onAddTrack as EventListener);

    // Periodically reposition all cues (catches new HLS segment cues)
    const poller = setInterval(repositionAllCues, 500);

    // Also reposition on DOM changes
    const observer = new MutationObserver(repositionAllCues);
    observer.observe(video, { childList: true });

    return () => {
      clearInterval(poller);
      observer.disconnect();
      video.textTracks.removeEventListener("addtrack", onAddTrack as EventListener);
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].removeEventListener("cuechange", onCueChange);
      }
    };
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

  // Track last tap position for left/right side detection
  const lastTapXRef = useRef(0);
  const isTouchRef = useRef(false);

  // Detect touch devices at interaction time
  const handleTouchStartOnVideo = useCallback(() => {
    isTouchRef.current = true;
  }, []);

  // Desktop: double-click = fullscreen, Mobile: double-tap = seek 10s fwd/bwd
  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    lastTapXRef.current = e.clientX - rect.left;
    const videoWidth = rect.width;

    if (clickTimerRef.current) {
      // Double tap/click
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = undefined;

      if (isTouchRef.current) {
        // Mobile: seek forward/backward based on tap side
        const video = videoRef.current;
        if (!video) return;
        if (lastTapXRef.current < videoWidth / 2) {
          video.currentTime = Math.max(0, video.currentTime - 10);
          showToast("-10s");
        } else {
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          showToast("+10s");
        }
      } else {
        // Desktop: toggle fullscreen
        toggleFullscreen();
      }
      isTouchRef.current = false;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = undefined;
        const video = videoRef.current;
        // Desktop: always toggle play/pause
        // Mobile: if paused, play it; if playing, just show controls
        if (!isTouchRef.current) {
          togglePlay();
        } else if (video?.paused) {
          togglePlay();
        } else {
          resetHideTimer();
        }
        isTouchRef.current = false;
      }, 250);
    }
  }, [togglePlay, toggleFullscreen, showToast, resetHideTimer]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    // hls.js quirk: seeking on a *paused* element doesn't reliably fetch +
    // decode the segment at the new position, so the <video> keeps showing
    // the last-decoded frame. Force-decoding via a play()/pause() cycle
    // works but is slow (requires segment fetch + decode each time).
    // Instead we paint the thumbnail-sprite cell at the seeked time as a
    // lightweight overlay over the <video>; the sprite is already in the
    // cache, so the visible "current frame" updates instantly. The actual
    // <video> frame will catch up the next time playback starts.
    if (video.paused && thumbCuesRef.current.length > 0) {
      const cue = thumbCuesRef.current.find(
        (cu) => time >= cu.start && time < cu.end
      );
      setPausedPreviewCue(cue ?? null);
    } else {
      setPausedPreviewCue(null);
    }
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
    const hls = hlsRef.current;

    const newEnabled = !state.subtitlesEnabled;

    // Use HLS.js API when available (master playlist)
    if (hls && hls.subtitleTracks.length > 0) {
      hls.subtitleTrack = newEnabled ? 0 : -1;
      hls.subtitleDisplay = newEnabled;
    }

    // Also toggle native text tracks
    const tracks = video.textTracks;
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
      const hls = hlsRef.current;

      // If using master playlist, switch level via HLS.js (no rebuild needed)
      if (hls && getMasterUrl(streamLinks)) {
        const targetHeight = Number(quality);
        const levelIndex = hls.levels.findIndex((l) => l.height === targetHeight);
        if (levelIndex >= 0) {
          hls.currentLevel = levelIndex;
        } else {
          hls.currentLevel = -1; // auto
        }
        setState((s) => ({ ...s, quality, error: null }));
        savePreferences({ preferredQuality: quality });
        showToast(`Quality: ${quality}p`);
        return;
      }

      // Fallback: rebuild HLS for per-quality playlists
      const currentTime = video.currentTime;
      const wasPlaying = !video.paused;

      setupHlsRef.current(video, quality, currentTime);

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
    [showToast, streamLinks]
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
        onTouchStart={handleTouchStartOnVideo}
        onTouchMove={resetHideTimer}
        playsInline
      />

      {/* Paused-seek thumbnail overlay. Renders only while paused with a
          matched cue. Pointer-events-none so clicks fall through to the
          <video> for resume-on-click. */}
      {!state.playing && pausedPreviewCue && (() => {
        // Compute sprite grid dimensions from the cue set. Each cell is
        // (cue.w × cue.h) px; sprite is (cols × rows) cells. Per-cell
        // scaling uses the well-known CSS sprite trick:
        //   - background-size:    `${cols*100}% ${rows*100}%`  -> 1 cell = 100% of container
        //   - background-position: `(col / (cols-1)) * 100%`   -> selects the cell
        // No knowledge of the underlying pixel dimensions needed.
        let cols = 1;
        let rows = 1;
        for (const cu of thumbCues) {
          const ci = Math.round(cu.x / Math.max(1, cu.w));
          const ri = Math.round(cu.y / Math.max(1, cu.h));
          if (ci + 1 > cols) cols = ci + 1;
          if (ri + 1 > rows) rows = ri + 1;
        }
        const cue = pausedPreviewCue;
        if (!cue.isSprite) {
          // Single-image-per-cue (older `thumb*.jpg` format).
          return (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1] bg-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cue.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          );
        }
        const col = Math.round(cue.x / Math.max(1, cue.w));
        const row = Math.round(cue.y / Math.max(1, cue.h));
        const posX = cols > 1 ? `${(col / (cols - 1)) * 100}%` : "0";
        const posY = rows > 1 ? `${(row / (rows - 1)) * 100}%` : "0";
        return (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] bg-black"
            style={{
              backgroundImage: `url("${cue.url}")`,
              backgroundSize: `${cols * 100}% ${rows * 100}%`,
              backgroundPosition: `${posX} ${posY}`,
              backgroundRepeat: "no-repeat",
            }}
          />
        );
      })()}

      {/* Loading spinner */}
      {state.loading && !state.error && (
        <div className="absolute inset-0 flex items-center justify-center pb-12 pointer-events-none">
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

      {/* Play button overlay - routes through handleVideoClick for desktop double-click=fullscreen */}
      {!state.playing && !state.loading && !state.error && !hidePlayOverlay && (
        <button
          type="button"
          onClick={(e) => handleVideoClick(e as unknown as React.MouseEvent<HTMLVideoElement>)}
          onTouchStart={handleTouchStartOnVideo}
          className="absolute inset-0 flex items-center justify-center pb-12"
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
          onSkipBackward={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = Math.max(0, video.currentTime - 10);
            showToast('-10s');
          }}
          onDraggingChange={(dragging) => { seekDraggingRef.current = dragging; if (dragging) { setControlsVisible(true); if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); } else { resetHideTimer(); } }}
          onSkipForward={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = Math.min(video.duration, video.currentTime + 10);
            showToast('+10s');
          }}
          theaterMode={theaterMode}
          onToggleTheater={onToggleTheater}
        />
      </div>

      {/* Toast */}
      <PlayerToast message={toast} />
    </div>
  );
}
