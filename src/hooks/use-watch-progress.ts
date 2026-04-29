"use client";

import { useEffect, useRef } from "react";

const ENDPOINT = "/api/watch-progress";
// One save every 15s during playback. The api route enforces 12/min as
// a hard ceiling; this client throttle prevents us from getting close.
const SAVE_INTERVAL_MS = 15_000;
// Don't save if the playhead hasn't moved more than this since the last
// save. Stops idle paused tabs from spamming the endpoint.
const MIN_DELTA_SECONDS = 5;

interface UseWatchProgressOptions {
  /** UUID of the episode being played. Hook is a no-op when null/undefined. */
  episodeId: string | null | undefined;
  /** Current player time in seconds. Read continuously. */
  currentTime: number;
  /** Video duration in seconds. Hook is a no-op while < 1 (metadata not loaded). */
  duration: number;
  /** True while the video element is actively playing. */
  isPlaying: boolean;
}

/**
 * Throttled save of watch position to the server (cross-device sync).
 *
 * Saves are coalesced to one per 15s during playback. A final save is
 * also emitted on pause and on `pagehide`/`beforeunload` (via
 * `navigator.sendBeacon`, which survives navigation).
 *
 * Anonymous users still hit the endpoint; the server returns 200 with
 * `anonymous: true` and no row is written. Client-side localStorage
 * persistence is handled separately by the existing watch_history code.
 */
export function useWatchProgress({
  episodeId,
  currentTime,
  duration,
  isPlaying,
}: UseWatchProgressOptions) {
  // Refs so the interval/listener callbacks always read the latest values
  // without needing to be re-bound on every state change.
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const lastSavedAtRef = useRef(0);
  const lastSavedPositionRef = useRef(-Infinity);
  const episodeIdRef = useRef(episodeId);

  currentTimeRef.current = currentTime;
  durationRef.current = duration;
  isPlayingRef.current = isPlaying;
  episodeIdRef.current = episodeId;

  useEffect(() => {
    if (!episodeId) return;

    const sendSave = (useBeacon = false) => {
      const epId = episodeIdRef.current;
      const pos = currentTimeRef.current;
      const dur = durationRef.current;
      if (!epId) return;
      if (!Number.isFinite(pos) || !Number.isFinite(dur) || dur < 1) return;
      // Skip saves for the first 5 seconds of an episode — those are
      // common drive-by clicks that we don't want polluting the
      // continue-watching shelf.
      if (pos < 5) return;

      const payload = JSON.stringify({
        episode_id: epId,
        position_seconds: pos,
        duration_seconds: dur,
      });

      if (useBeacon && navigator.sendBeacon) {
        try {
          // sendBeacon survives the page being unloaded.
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(ENDPOINT, blob);
        } catch {
          /* noop */
        }
      } else {
        try {
          void fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            credentials: "same-origin",
            keepalive: true,
          }).catch(() => {});
        } catch {
          /* noop */
        }
      }

      lastSavedAtRef.current = Date.now();
      lastSavedPositionRef.current = pos;
    };

    const tick = () => {
      if (!isPlayingRef.current) return;
      const now = Date.now();
      if (now - lastSavedAtRef.current < SAVE_INTERVAL_MS) return;
      const moved = Math.abs(
        currentTimeRef.current - lastSavedPositionRef.current
      );
      if (moved < MIN_DELTA_SECONDS) return;
      sendSave(false);
    };

    const interval = window.setInterval(tick, 5_000);

    // Final save on tab hide / page unload via sendBeacon (works across
    // most browsers including Safari, where keepalive fetch is unreliable).
    const onPageHide = () => sendSave(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendSave(true);
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // One last save on unmount in case the user clicked to a new
      // episode without unloading the page (SPA navigation).
      sendSave(false);
    };
  }, [episodeId]);
}
