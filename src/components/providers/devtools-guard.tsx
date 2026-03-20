"use client";

import { useEffect } from "react";

export function DevToolsGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const init = async () => {
      const DisableDevtool = (await import("disable-devtool")).default;

      DisableDevtool({
        ondevtoolopen: () => {
          // Kill media and nuke the page
          try {
            const m = document.querySelectorAll("video,audio,source");
            m.forEach((el: any) => {
              el.pause?.();
              el.removeAttribute("src");
              el.load?.();
            });
          } catch (e) {}
          try {
            document.write("");
            document.close();
          } catch (e) {}
          window.location.replace(window.location.href);
        },
        disableMenu: false,     // don't block right-click
        disableSelect: false,
        disableCopy: false,
        disableCut: false,
        disablePaste: false,
        clearLog: true,
        interval: 1000,
        detectors: [0, 1, 3, 4, 6, 7],
        // 0=RegToString, 1=DefineId, 3=DateToString, 4=FuncToString, 6=Performance, 7=DebugLib
        // Skipped: 2=Size (false positives), 5=Debugger (extension conflicts)
      });
    };

    init();
  }, []);

  return null;
}
