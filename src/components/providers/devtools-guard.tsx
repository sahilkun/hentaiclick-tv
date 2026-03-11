"use client";

import { useEffect } from "react";

/**
 * Anti-DevTools protection layer.
 * Deters casual inspection — not bulletproof against determined users.
 */
export function DevToolsGuard() {
  useEffect(() => {
    // Skip in development
    if (process.env.NODE_ENV !== "production") return;

    // --- 1. Block keyboard shortcuts ---
    const onKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+C / Cmd+Opt+C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        return;
      }
      // Ctrl+U / Cmd+U (View source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return;
      }
    };

    // --- 2. Block right-click context menu ---
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // --- 3. DevTools detection via debugger timing ---
    let detectionInterval: ReturnType<typeof setInterval>;

    const detectDevTools = () => {
      const start = performance.now();
      // debugger statement pauses execution when DevTools is open
      // eslint-disable-next-line no-debugger
      debugger;
      const duration = performance.now() - start;
      if (duration > 100) {
        document.body.innerHTML = "";
        window.location.replace("about:blank");
      }
    };

    // --- 4. Console warning ---
    const warn = () => {
      console.clear();
      console.log(
        "%cStop!",
        "color: red; font-size: 48px; font-weight: bold;"
      );
      console.log(
        "%cThis browser feature is intended for developers. Do not paste any code here.",
        "font-size: 16px;"
      );
    };

    // --- 5. Detect window resize (devtools docked) ---
    const threshold = 160;
    const onResize = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        document.body.style.display = "none";
      } else {
        document.body.style.display = "";
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("resize", onResize);
    detectionInterval = setInterval(detectDevTools, 3000);
    warn();

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("resize", onResize);
      clearInterval(detectionInterval);
    };
  }, []);

  return null;
}
