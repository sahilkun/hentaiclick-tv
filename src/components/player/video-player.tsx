"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { TriangleAlert, RotateCcw } from "lucide-react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { getStreamUrl, getSubtitleUrl } from "@/lib/cdn";
import type { Quality } from "@/lib/constants";
import {
  loadPreferences,
  savePreferences,
  type PlayerState,
} from "@/types/player";
import { PlayerControls } from "./player-controls";
import { PlayerToast } from "./player-toast";

interface VideoPlayerProps {
  streamPath: string;
  availableQualities: Quality[];
  allowedQualities: Quality[];
  onView?: () => void;
  className?: string;
}

export function VideoPlayer({
  streamPath,
  availableQualities,
  allowedQualities,
  onView,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewCountedRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const [toast, setToast] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
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
    subtitlesEnabled: false,
    subtitleTrack: null,
    audioTrack: 0,
    loading: true,
    error: null,
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const retryLoad = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamPath) return;

    retryCountRef.current = 0;
    setState((s) => ({ ...s, loading: true, error: null }));

    hlsRef.current?.destroy();

    const prefs = loadPreferences();
    const defaultQuality =
      prefs.preferredQuality !== "auto" &&
      allowedQualities.includes(prefs.preferredQuality)
        ? prefs.preferredQuality
        : allowedQualities[allowedQualities.length - 1] ?? 720;

    const streamUrl = getStreamUrl(streamPath, defaultQuality as Quality);

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        setState((s) => ({ ...s, loading: false, error: null }));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            retryCountRef.current++;
            if (retryCountRef.current <= MAX_RETRIES) {
              setTimeout(() => hls.startLoad(), 1000 * retryCountRef.current);
            } else {
              setState((s) => ({
                ...s,
                loading: false,
                error: "Video unavailable. The stream could not be loaded.",
              }));
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setState((s) => ({
              ...s,
              loading: false,
              error: "An unexpected playback error occurred.",
            }));
          }
        }
      });
    }
  }, [streamPath, allowedQualities]);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamPath) return;

    const prefs = loadPreferences();
    const defaultQuality =
      prefs.preferredQuality !== "auto" &&
      allowedQualities.includes(prefs.preferredQuality)
        ? prefs.preferredQuality
        : allowedQualities[allowedQualities.length - 1] ?? 720;

    const streamUrl = getStreamUrl(streamPath, defaultQuality as Quality);

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        setState((s) => ({ ...s, loading: false, error: null }));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            retryCountRef.current++;
            if (retryCountRef.current <= MAX_RETRIES) {
              console.warn(
                `HLS network error, retrying (${retryCountRef.current}/${MAX_RETRIES})...`
              );
              setTimeout(() => hls.startLoad(), 1000 * retryCountRef.current);
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
      video.addEventListener("loadedmetadata", () => {
        setState((s) => ({ ...s, loading: false }));
      });
    }

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
    };
  }, [streamPath, allowedQualities]);

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

      // Track play time for view counting
      if (!video.paused) {
        playTimeRef.current += 0.25; // approximate timeupdate interval
        if (playTimeRef.current >= 30 && !viewCountedRef.current) {
          viewCountedRef.current = true;
          onView?.();
        }
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

    const onPlay = () => setState((s) => ({ ...s, playing: true }));
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
      }

      resetHideTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetHideTimer, showToast]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setState((s) => ({ ...s, fullscreen: false }));
    } else {
      container.requestFullscreen();
      setState((s) => ({ ...s, fullscreen: true }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

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

  const changeQuality = useCallback(
    (quality: Quality) => {
      const video = videoRef.current;
      if (!video) return;

      const currentTime = video.currentTime;
      const wasPlaying = !video.paused;

      hlsRef.current?.destroy();
      retryCountRef.current = 0;

      const streamUrl = getStreamUrl(streamPath, quality);
      const hls = new Hls({ startLevel: -1 });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = currentTime;
        if (wasPlaying) video.play();
        setState((s) => ({ ...s, error: null }));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            retryCountRef.current++;
            if (retryCountRef.current <= MAX_RETRIES) {
              setTimeout(() => hls.startLoad(), 1000 * retryCountRef.current);
            } else {
              setState((s) => ({
                ...s,
                loading: false,
                error: "Video unavailable. The stream could not be loaded.",
              }));
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });

      setState((s) => ({ ...s, quality, error: null }));
      savePreferences({ preferredQuality: quality });
      showToast(`Quality: ${quality}p`);
    },
    [streamPath, showToast]
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
        onClick={togglePlay}
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
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
          onTogglePlay={togglePlay}
          onSeek={seek}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onChangeQuality={changeQuality}
          onChangeSpeed={changeSpeed}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      {/* Toast */}
      <PlayerToast message={toast} />
    </div>
  );
}
