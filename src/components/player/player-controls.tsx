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
  onToggleFullscreen: () => void;
  onToggleSubtitles: () => void;
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
  onToggleFullscreen,
  onToggleSubtitles,
}: PlayerControlsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<
    "main" | "quality" | "speed"
  >("main");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const bufferedProgress =
    state.duration > 0 ? (state.buffered / state.duration) * 100 : 0;

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * state.duration);
  };

  const handleSeekBarHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = percent * state.duration;
      setHoverTime(time);
      setHoverX(e.clientX - rect.left);
    },
    [state.duration]
  );

  const handleSeekBarLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Find thumbnail for current hover time
  const hoverThumb =
    hoverTime !== null
      ? thumbCues.find((c) => hoverTime >= c.start && hoverTime < c.end)
      : null;

  return (
    <div className="bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8">
      {/* Seek bar */}
      <div className="relative mb-2">
        {/* Thumbnail preview tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute bottom-4 -translate-x-1/2 pointer-events-none"
            style={{ left: hoverX }}
          >
            {hoverThumb ? (
              <div className="mb-1 overflow-hidden rounded border border-white/20 bg-black">
                {hoverThumb.x === 0 && hoverThumb.y === 0 ? (
                  /* Individual thumbnail image */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={hoverThumb.url}
                    alt=""
                    style={{ width: hoverThumb.w, height: hoverThumb.h }}
                    className="object-cover"
                  />
                ) : (
                  /* Sprite sheet thumbnail */
                  <div
                    style={{
                      width: hoverThumb.w,
                      height: hoverThumb.h,
                      backgroundImage: `url(${hoverThumb.url})`,
                      backgroundPosition: `-${hoverThumb.x}px -${hoverThumb.y}px`,
                      backgroundSize: "auto",
                    }}
                  />
                )}
              </div>
            ) : null}
            <div className="text-center text-xs text-white bg-black/80 rounded px-1.5 py-0.5">
              {formatDuration(hoverTime)}
            </div>
          </div>
        )}

        <div
          ref={seekBarRef}
          className="group/seek relative cursor-pointer pb-[4px] pt-4"
          onClick={handleSeekBarClick}
          onMouseMove={handleSeekBarHover}
          onMouseLeave={handleSeekBarLeave}
        >
          {/* Visual seek bar (thin line at bottom of hit area) */}
          <div className="relative h-1 rounded-full bg-white/30 transition-all group-hover/seek:h-1.5">
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
              <div className="absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-primary opacity-0 transition-opacity group-hover/seek:opacity-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-8 w-8 items-center justify-center text-white hover:text-primary"
        >
          {state.playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        {/* Time */}
        <span className="text-xs text-white/80">
          {formatDuration(state.currentTime)} / {formatDuration(state.duration)}
        </span>

        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-8 w-8 items-center justify-center text-white hover:text-primary"
          >
            {state.muted || state.volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
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

        {/* Subtitles toggle */}
        <button
          type="button"
          onClick={onToggleSubtitles}
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
            onClick={() => {
              setSettingsOpen(!settingsOpen);
              setSettingsPanel("main");
            }}
            className="flex h-8 w-8 items-center justify-center text-white hover:text-primary"
          >
            <Settings className="h-5 w-5" />
          </button>

          {settingsOpen && (
            <div className="absolute bottom-10 right-0 w-48 rounded-lg border border-white/10 bg-black/95 py-1 text-sm text-white shadow-xl">
              {settingsPanel === "main" && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10"
                    onClick={() => setSettingsPanel("quality")}
                  >
                    <span>Quality</span>
                    <span className="text-xs text-white/60">
                      {state.quality === "auto"
                        ? "Auto"
                        : QUALITY_LABELS[state.quality as Quality] ??
                          `${state.quality}p`}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10"
                    onClick={() => setSettingsPanel("speed")}
                  >
                    <span>Speed</span>
                    <span className="text-xs text-white/60">
                      {state.playbackSpeed}x
                    </span>
                  </button>
                </>
              )}

              {settingsPanel === "quality" && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10"
                    onClick={() => setSettingsPanel("main")}
                  >
                    ← Quality
                  </button>
                  {availableQualities
                    .slice()
                    .reverse()
                    .map((q) => {
                      const allowed = allowedQualities.includes(q);
                      return (
                        <button
                          key={q}
                          type="button"
                          disabled={!allowed}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2",
                            allowed
                              ? "hover:bg-white/10"
                              : "cursor-not-allowed opacity-40"
                          )}
                          onClick={() => {
                            if (allowed) {
                              onChangeQuality(q as Quality);
                              setSettingsOpen(false);
                            }
                          }}
                        >
                          <span>
                            {QUALITY_LABELS[q as Quality] ?? `${q}p`}
                          </span>
                          {!allowed && (
                            <span className="text-xs">🔒</span>
                          )}
                          {state.quality === q && allowed && (
                            <span className="text-xs text-primary">●</span>
                          )}
                        </button>
                      );
                    })}
                </>
              )}

              {settingsPanel === "speed" && (
                <>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10"
                    onClick={() => setSettingsPanel("main")}
                  >
                    ← Speed
                  </button>
                  {PLAYBACK_SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-white/10"
                      onClick={() => {
                        onChangeSpeed(s);
                        setSettingsOpen(false);
                      }}
                    >
                      <span>{s}x</span>
                      {state.playbackSpeed === s && (
                        <span className="text-xs text-primary">●</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex h-8 w-8 items-center justify-center text-white hover:text-primary"
        >
          {state.fullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
