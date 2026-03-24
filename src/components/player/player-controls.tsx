"use client";

import { useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { QUALITY_LABELS, PLAYBACK_SPEEDS, type Quality } from "@/lib/constants";
import type { PlayerState } from "@/types/player";
import type { ThumbCue } from "./video-player";

interface PlayerControlsProps {
  state: PlayerState;
  allowedQualities: Quality[];
  availableQualities: Quality[];
  thumbCues: ThumbCue[];
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onChangeQuality: (q: Quality) => void;
  onChangeSpeed: (s: number) => void;
  onChangeAudioTrack: (idx: number) => void;
  onChangeSubtitleTrack: (lang: string | null) => void;
  onToggleFullscreen: () => void;
  onToggleSubtitles: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onDraggingChange?: (dragging: boolean) => void;
}

export function PlayerControls({
  state,
  allowedQualities,
  availableQualities,
  thumbCues,
  onTogglePlay,
  onSeek,
  onSetVolume,
  onToggleMute,
  onChangeQuality,
  onChangeSpeed,
  onChangeAudioTrack,
  onChangeSubtitleTrack,
  onToggleFullscreen,
  onToggleSubtitles,
  onSkipBackward,
  onSkipForward,
  onDraggingChange,
}: PlayerControlsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<
    "main" | "quality" | "speed" | "audio" | "subtitles"
  >("main");

  // Seekbar state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const getTimeFromX = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      if (!bar || state.duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percent * state.duration;
    },
    [state.duration]
  );

  const getLocalX = useCallback((clientX: number) => {
    const bar = seekBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(rect.width, clientX - rect.left));
  }, []);

  // Mouse hover (not dragging)
  const handleSeekBarHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) return;
      setHoverTime(getTimeFromX(e.clientX));
      setHoverX(getLocalX(e.clientX));
    },
    [isDragging, getTimeFromX, getLocalX]
  );

  const handleSeekBarLeave = useCallback(() => {
    if (!isDragging) setHoverTime(null);
  }, [isDragging]);

  // Mouse drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true); onDraggingChange?.(true);
      const time = getTimeFromX(e.clientX);
      const x = getLocalX(e.clientX);
      setDragTime(time);
      setDragX(x);
      onSeek(time);

      const onMouseMove = (ev: MouseEvent) => {
        const t = getTimeFromX(ev.clientX);
        const lx = getLocalX(ev.clientX);
        setDragTime(t);
        setDragX(lx);
        onSeek(t);
      };
      const onMouseUp = (ev: MouseEvent) => {
        const t = getTimeFromX(ev.clientX);
        onSeek(t);
        setIsDragging(false); onDraggingChange?.(false);
        setDragTime(null);
        setHoverTime(null);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [getTimeFromX, getLocalX, onSeek]
  );

  // Touch drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(true); onDraggingChange?.(true);
      const touch = e.touches[0];
      const time = getTimeFromX(touch.clientX);
      const x = getLocalX(touch.clientX);
      setDragTime(time);
      setDragX(x);
      onSeek(time);
    },
    [getTimeFromX, getLocalX, onSeek]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      const touch = e.touches[0];
      const time = getTimeFromX(touch.clientX);
      const x = getLocalX(touch.clientX);
      setDragTime(time);
      setDragX(x);
      onSeek(time);
    },
    [isDragging, getTimeFromX, getLocalX, onSeek]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false); onDraggingChange?.(false);
    setDragTime(null);
  }, []);

  // Preview: show thumbnail during hover OR drag
  const previewTime = isDragging ? dragTime : hoverTime;
  const previewX = isDragging ? dragX : hoverX;
  const showPreview = previewTime !== null;

  const previewThumb =
    previewTime !== null
      ? thumbCues.find((c) => previewTime >= c.start && previewTime < c.end)
      : null;

  // Progress bar position follows drag if dragging
  const progress =
    state.duration > 0
      ? isDragging && dragTime !== null
        ? (dragTime / state.duration) * 100
        : (state.currentTime / state.duration) * 100
      : 0;
  const bufferedProgress =
    state.duration > 0 ? (state.buffered / state.duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8">
      {/* Seek bar */}
      <div className="relative mb-2">
        {/* Thumbnail preview tooltip */}
        {showPreview && (
          <div
            className="absolute bottom-4 -translate-x-1/2 pointer-events-none z-10"
            style={{ left: previewX }}
          >
            {previewThumb ? (
              <div className="mb-1 overflow-hidden rounded border border-white/20 bg-black">
                {previewThumb.x === 0 && previewThumb.y === 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewThumb.url}
                    alt=""
                    style={{ width: previewThumb.w, height: previewThumb.h }}
                    className="object-cover"
                  />
                ) : (
                  <div
                    style={{
                      width: previewThumb.w,
                      height: previewThumb.h,
                      backgroundImage: `url(${previewThumb.url})`,
                      backgroundPosition: `-${previewThumb.x}px -${previewThumb.y}px`,
                      backgroundSize: "auto",
                    }}
                  />
                )}
              </div>
            ) : null}
            <div className="text-center text-xs text-white bg-black/80 rounded px-1.5 py-0.5">
              {formatDuration(previewTime!)}
            </div>
          </div>
        )}

        <div
          ref={seekBarRef}
          className="group/seek relative cursor-pointer pb-[4px] pt-4 touch-none"
          onMouseMove={handleSeekBarHover}
          onMouseLeave={handleSeekBarLeave}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Visual seek bar */}
          <div className={cn(
            "relative rounded-full bg-white/30 transition-all",
            isDragging ? "h-1.5" : "h-1 group-hover/seek:h-1.5"
          )}>
            {/* Buffered */}
            <div
              className="absolute h-full rounded-full bg-white/20"
              style={{ width: `${bufferedProgress}%` }}
            />
            {/* Progress */}
            <div
              className="relative h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            >
              <div className={cn(
                "absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-primary transition-opacity",
                isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover/seek:opacity-100"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button type="button" onClick={onTogglePlay} className="flex h-8 w-8 items-center justify-center text-white hover:text-primary">
          {state.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={onToggleMute} className="flex h-8 w-8 items-center justify-center text-white hover:text-primary">
            {state.muted || state.volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={state.muted ? 0 : state.volume}
            onChange={(e) => onSetVolume(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-primary"
          />
        </div>

        {/* Time - shows drag time while dragging */}
        <span className="text-xs text-white/80">
          {formatDuration(isDragging && dragTime !== null ? dragTime : state.currentTime)} / {formatDuration(state.duration)}
        </span>

        <div className="flex-1" />

        {/* Skip Backward 10s */}
        <button type="button" onClick={onSkipBackward} className="flex h-8 w-8 items-center justify-center text-white hover:text-primary" title="Rewind 10s">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
            <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            <path d="M10.89 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm3.32-1.3c0 .27-.03.51-.09.71-.06.2-.15.37-.27.52s-.27.26-.45.33c-.17.08-.38.12-.6.12-.23 0-.43-.04-.6-.12-.18-.08-.33-.19-.45-.33s-.21-.32-.27-.52c-.06-.2-.09-.44-.09-.71v-.74c0-.27.03-.51.09-.71.06-.2.15-.37.27-.51.12-.15.27-.26.45-.34.17-.08.37-.12.6-.12s.43.04.6.12c.18.08.33.19.45.34.12.14.21.31.27.51.06.2.09.44.09.71v.74zm-.78-.86c0-.35-.06-.6-.17-.76-.11-.15-.28-.23-.49-.23s-.38.08-.49.23c-.11.16-.17.41-.17.76v.98c0 .35.06.6.17.76.12.15.28.23.49.23s.38-.08.49-.23c.11-.15.17-.41.17-.76v-.98z"/>
          </svg>
        </button>

        {/* Skip Forward 10s */}
        <button type="button" onClick={onSkipForward} className="flex h-8 w-8 items-center justify-center text-white hover:text-primary" title="Forward 10s">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
            <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
            <path d="M10.89 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm3.32-1.3c0 .27-.03.51-.09.71-.06.2-.15.37-.27.52s-.27.26-.45.33c-.17.08-.38.12-.6.12-.23 0-.43-.04-.6-.12-.18-.08-.33-.19-.45-.33s-.21-.32-.27-.52c-.06-.2-.09-.44-.09-.71v-.74c0-.27.03-.51.09-.71.06-.2.15-.37.27-.51.12-.15.27-.26.45-.34.17-.08.37-.12.6-.12s.43.04.6.12c.18.08.33.19.45.34.12.14.21.31.27.51.06.2.09.44.09.71v.74zm-.78-.86c0-.35-.06-.6-.17-.76-.11-.15-.28-.23-.49-.23s-.38.08-.49.23c-.11.16-.17.41-.17.76v.98c0 .35.06.6.17.76.12.15.28.23.49.23s.38-.08.49-.23c.11-.15.17-.41.17-.76v-.98z"/>
          </svg>
        </button>

        {/* Subtitles toggle */}
        <button
          type="button"
          onClick={
            state.availableSubtitles.length > 1
              ? () => { setSettingsOpen(true); setSettingsPanel("subtitles"); }
              : onToggleSubtitles
          }
          className={cn(
            "flex h-8 w-8 items-center justify-center hover:text-primary",
            state.subtitlesEnabled ? "text-primary" : "text-white"
          )}
          title="Subtitles (C)"
        >
          <Subtitles className="h-5 w-5" />
        </button>

        {/* Settings */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setSettingsOpen(!settingsOpen); setSettingsPanel("main"); }}
            className="flex h-8 w-8 items-center justify-center text-white hover:text-primary"
          >
            <Settings className="h-5 w-5" />
          </button>

          {settingsOpen && (
            <div className="absolute bottom-10 right-0 w-48 rounded-lg border border-white/10 bg-black/95 py-1 text-sm text-white shadow-xl">
              {settingsPanel === "main" && (
                <>
                  <button type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => setSettingsPanel("quality")}>
                    <span>Quality</span>
                    <span className="text-xs text-white/60">{state.quality === "auto" ? "Auto" : QUALITY_LABELS[state.quality as Quality] ?? `${state.quality}p`}</span>
                  </button>
                  <button type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => setSettingsPanel("speed")}>
                    <span>Speed</span>
                    <span className="text-xs text-white/60">{state.playbackSpeed}x</span>
                  </button>
                  {state.availableAudioTracks.length > 1 && (
                    <button type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => setSettingsPanel("audio")}>
                      <span>Audio</span>
                      <span className="text-xs text-white/60">{state.availableAudioTracks[state.audioTrack]?.name ?? "Default"}</span>
                    </button>
                  )}
                  {state.availableSubtitles.length > 0 && (
                    <button type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => setSettingsPanel("subtitles")}>
                      <span>Subtitles</span>
                      <span className="text-xs text-white/60">{state.subtitleTrack ? state.availableSubtitles.find((s) => s.lang === state.subtitleTrack)?.label ?? "On" : "Off"}</span>
                    </button>
                  )}
                </>
              )}
              {settingsPanel === "quality" && (
                <>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10" onClick={() => setSettingsPanel("main")}>{"← Quality"}</button>
                  {availableQualities.slice().reverse().map((q) => {
                    const allowed = allowedQualities.includes(q);
                    return (
                      <button key={q} type="button" disabled={!allowed} className={cn("flex w-full items-center justify-between px-3 py-2", allowed ? "hover:bg-white/10" : "cursor-not-allowed opacity-40")} onClick={() => { if (allowed) { onChangeQuality(q as Quality); setSettingsOpen(false); } }}>
                        <span>{QUALITY_LABELS[q as Quality] ?? `${q}p`}</span>
                        {!allowed && <span className="text-xs">{"🔒"}</span>}
                        {state.quality === q && allowed && <span className="text-xs text-primary">{"●"}</span>}
                      </button>
                    );
                  })}
                </>
              )}
              {settingsPanel === "speed" && (
                <>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10" onClick={() => setSettingsPanel("main")}>{"← Speed"}</button>
                  {PLAYBACK_SPEEDS.map((s) => (
                    <button key={s} type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => { onChangeSpeed(s); setSettingsOpen(false); }}>
                      <span>{s}x</span>
                      {state.playbackSpeed === s && <span className="text-xs text-primary">{"●"}</span>}
                    </button>
                  ))}
                </>
              )}
              {settingsPanel === "audio" && (
                <>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10" onClick={() => setSettingsPanel("main")}>{"← Audio"}</button>
                  {state.availableAudioTracks.map((track) => (
                    <button key={track.id} type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => { onChangeAudioTrack(track.id); setSettingsOpen(false); }}>
                      <span>{track.name}</span>
                      {state.audioTrack === track.id && <span className="text-xs text-primary">{"●"}</span>}
                    </button>
                  ))}
                </>
              )}
              {settingsPanel === "subtitles" && (
                <>
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10" onClick={() => setSettingsPanel("main")}>{"← Subtitles"}</button>
                  <button type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => { onChangeSubtitleTrack(null); setSettingsOpen(false); }}>
                    <span>Off</span>
                    {!state.subtitleTrack && <span className="text-xs text-primary">{"●"}</span>}
                  </button>
                  {state.availableSubtitles.map((sub) => (
                    <button key={sub.lang} type="button" className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10" onClick={() => { onChangeSubtitleTrack(sub.lang); setSettingsOpen(false); }}>
                      <span>{sub.label}</span>
                      {state.subtitleTrack === sub.lang && <span className="text-xs text-primary">{"●"}</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button type="button" onClick={onToggleFullscreen} className="flex h-8 w-8 items-center justify-center text-white hover:text-primary">
          {state.fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
