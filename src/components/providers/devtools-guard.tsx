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

    init();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  return null;
}
