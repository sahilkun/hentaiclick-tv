"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function DevToolsGuard() {
  const { user } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // Skip the anti-devtools script for staff so they can debug.
    if (user?.role === "admin" || user?.role === "moderator") return;

    let cancelled = false;
    let scheduleId: ReturnType<typeof setTimeout> | number | undefined;

    const init = async () => {
      const DisableDevtool = (await import("disable-devtool")).default;
      if (cancelled) return;

      DisableDevtool({
        ondevtoolopen: () => {
          // Kill media and nuke the page
          try {
            const m = document.querySelectorAll<HTMLMediaElement>(
              "video,audio,source"
            );
            m.forEach((el) => {
              el.pause?.();
              el.removeAttribute("src");
              el.load?.();
            });
          } catch {}
          try {
            document.write("");
            document.close();
          } catch {}
          window.location.replace(window.location.href);
        },
        disableMenu: false,
        disableSelect: false,
        disableCopy: false,
        disableCut: false,
        disablePaste: false,
        clearLog: true,
        interval: 1000,
        detectors: [0, 1, 3, 4, 6, 7],
      });
    };

    // Defer initialization until the browser is idle, so it doesn't compete
    // with first paint, hydration, or LCP image decode. Falls back to a 2s
    // setTimeout in browsers without requestIdleCallback (Safari).
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback === "function") {
      scheduleId = w.requestIdleCallback(() => init(), { timeout: 4000 });
    } else {
      scheduleId = setTimeout(init, 2000);
    }

    return () => {
      cancelled = true;
      if (scheduleId !== undefined) {
        if (typeof w.cancelIdleCallback === "function" && typeof scheduleId === "number") {
          w.cancelIdleCallback(scheduleId);
        }
        clearTimeout(scheduleId as ReturnType<typeof setTimeout>);
      }
    };
  }, [user?.role]);

  return null;
}
