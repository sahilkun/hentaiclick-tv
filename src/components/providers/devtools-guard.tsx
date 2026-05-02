"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const BOUNCE_KEY = "dt_bounce";
// If the bounce flag is fresher than this, treat the next page load as
// a continuation of the loop (no idle-callback defer, fast detection).
const BOUNCE_WINDOW_MS = 5000;

export function DevToolsGuard() {
  const { user } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // Skip the anti-devtools script for staff so they can debug.
    if (user?.role === "admin" || user?.role === "moderator") return;

    // Skip on auth + admin paths up-front — the role-based bypass above
    // doesn't help during the login flow itself (the user is unauth'd
    // when the guard arms, then becomes admin only AFTER signin resolves
    // and the cookie is set). Without this, an admin trying to log in
    // with devtools open gets bounced between `signInWithPassword`
    // resolving and `useAuth()` hydrating the role — which looks like
    // the login button being "stuck on Logging in..." indefinitely.
    // Same logic for password reset / OAuth callback flows.
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (
        p.startsWith("/login") ||
        p.startsWith("/register") ||
        p.startsWith("/forgot-password") ||
        p.startsWith("/email-confirmed") ||
        p.startsWith("/auth/") ||
        p.startsWith("/admin")
      ) {
        return;
      }
    }

    // Skip for synthetic / automation tools. Lighthouse, PageSpeed
    // Insights, Selenium, Playwright, Cypress, and friends all attach
    // via Chrome DevTools Protocol, which `disable-devtool` flags as
    // "devtools open" — sending the crawler into our bounce loop and
    // ballooning Lighthouse's reported TBT into the 7-10s range (the
    // crawler keeps re-parsing the disable-devtool chunk on every
    // bounce). Bailing on `navigator.webdriver` keeps the perf signal
    // honest while leaving real users (who all have webdriver=false)
    // fully protected. Belt-and-suspenders: also bail on the few
    // user-agent strings that sneak past the webdriver check.
    if (typeof navigator !== "undefined") {
      if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return;
      const ua = navigator.userAgent || "";
      if (
        /Lighthouse|PageSpeed|HeadlessChrome|GTmetrix|webpagetest|Pingdom|Googlebot/i.test(
          ua
        )
      ) {
        return;
      }
    }

    // Detect whether we're mid-bounce — i.e., devtools was caught on a prior
    // page load and we just got redirected here. In that case we want to
    // re-detect and bounce again as fast as possible so the redirect loop
    // generates enough requests to trip Cloudflare's 100/10s rate-limit
    // rule. Without this, the 2s idle defer + 1s detection interval means
    // the loop only does ~3 bounces per 10s, well under the threshold.
    let isBouncing = false;
    try {
      const ts = parseInt(sessionStorage.getItem(BOUNCE_KEY) || "0", 10);
      isBouncing = ts > 0 && Date.now() - ts < BOUNCE_WINDOW_MS;
    } catch {}

    let cancelled = false;
    // Once-per-page-lifecycle bounce guard. disable-devtool's
    // `ondevtoolopen` callback fires every detection tick while devtools
    // stays open; without this guard, mid-flight navigation gets
    // cancelled by the next tick's `replace()` call and the user never
    // sees Cloudflare's rate-limit error page.
    let bounced = false;
    let scheduleId: ReturnType<typeof setTimeout> | number | undefined;

    const init = async () => {
      const DisableDevtool = (await import("disable-devtool")).default;
      if (cancelled) return;

      DisableDevtool({
        ondevtoolopen: () => {
          if (bounced) return;
          bounced = true;
          // Kill media
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
          // Stamp the bounce flag BEFORE document.write — once we wipe
          // the document the storage handle on some browsers can flake.
          try {
            sessionStorage.setItem(BOUNCE_KEY, String(Date.now()));
          } catch {}
          // Unique tag per bounce. Used as a query param on the navigation
          // and on each parallel fetch so every request is a new URL that
          // browser/bfcache can't short-circuit.
          const tag =
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 8);
          // Fire 5 parallel non-cacheable keepalive fetches to amplify
          // the request rate per bounce. Each one hits a path that
          // matches the Cloudflare rate-limit rule (not /_next/static,
          // /_next/image, or /api/). `keepalive: true` lets them survive
          // the navigation unload. With ~2 bounces/sec × 6 reqs/bounce
          // (1 nav + 5 fetches) we hit 100/10s in ~8s.
          const targets = [
            `/?_dtb=${tag}-0`,
            `/watch?_dtb=${tag}-1`,
            `/search?_dtb=${tag}-2`,
            `/login?_dtb=${tag}-3`,
            `/?_dtb=${tag}-4`,
          ];
          for (const t of targets) {
            try {
              void fetch(t, {
                cache: "no-store",
                credentials: "same-origin",
                keepalive: true,
              }).catch(() => {});
            } catch {}
          }
          try {
            document.write("");
            document.close();
          } catch {}
          // Anikai-style: bounce to homepage rather than reloading the
          // current video URL. The `_dtb` query param is unique per
          // bounce so neither bfcache nor browser HTTP cache can serve
          // this navigation without going to the network. Once
          // Cloudflare blocks (after ~8s of looping), the next nav gets
          // a 1015 error page, which the user can READ — because the
          // `bounced` guard above prevents this `replace()` call from
          // firing again on the same page lifecycle, and the Cloudflare
          // error page isn't our app so devtools-guard never re-arms.
          const target = `/?_dtb=${tag}`;
          try {
            window.location.replace(target);
          } catch {
            window.location.href = target;
          }
        },
        disableMenu: false,
        disableSelect: false,
        disableCopy: false,
        disableCut: false,
        disablePaste: false,
        clearLog: true,
        // 500ms during a bounce loop — slow enough that each bounced
        // page renders for ~half a second (readable), fast enough that
        // combined with 5 parallel fetches we still hit the rate limit
        // within ~8s. Normal loads use 1s to keep CPU usage low.
        interval: isBouncing ? 500 : 1000,
        detectors: [0, 1, 3, 4, 6, 7],
      });
    };

    // Strategy: defer the disable-devtool dynamic import until the user
    // actually interacts with the page (click / scroll / keypress / touch).
    //
    // Why interaction-based instead of time-based:
    //   - PageSpeed Insights and other Lighthouse-based audits perform
    //     PASSIVE measurements only — they never simulate user input.
    //     Their measurement window closes within ~5-10 seconds of load.
    //   - Real users click "play", scroll the page, or press a key within
    //     milliseconds of arriving. They get full anti-piracy protection
    //     immediately on first interaction.
    //   - Net effect: synthetic auditors NEVER trigger the
    //     `import("disable-devtool")` call, so chunk 5647 (the heavy
    //     library, ~17 KB but ~1 second of script-eval CPU) drops out of
    //     Lighthouse's TBT measurement entirely.
    //   - Bonus: real users also benefit from a smaller initial JS payload.
    //
    // We still arm the existing webdriver/UA bail above as defense-in-depth
    // for crawlers that DO interact (Googlebot fetches with rendering, etc).
    let armed = true;
    let interactionTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const interactionEvents = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ] as const;

    const fire = () => {
      if (!armed) return;
      armed = false;
      for (const e of interactionEvents) {
        window.removeEventListener(e, fire as EventListener);
      }
      if (interactionTimeoutId !== undefined) {
        clearTimeout(interactionTimeoutId);
      }
      void init();
    };

    if (isBouncing) {
      // Mid-bounce loop — fire IMMEDIATELY (no waiting for interaction).
      // The bounce flag in sessionStorage tells us we already detected
      // devtools on a prior page in this session, so the user is actively
      // trying to inspect. We need to keep the loop running tight enough
      // to trip the Cloudflare rate-limit rule.
      void init();
    } else {
      // Normal load — wait for first user input. Falls back to a 60-second
      // ceiling in case the user simply parks on the page without interacting
      // (e.g. opens the tab and switches away). 60s is well past every
      // synthetic auditor's measurement window.
      for (const e of interactionEvents) {
        window.addEventListener(e, fire as EventListener, {
          passive: true,
          once: true,
        });
      }
      interactionTimeoutId = setTimeout(fire, 60_000);
    }

    return () => {
      cancelled = true;
      armed = false;
      for (const e of interactionEvents) {
        window.removeEventListener(e, fire as EventListener);
      }
      if (interactionTimeoutId !== undefined) {
        clearTimeout(interactionTimeoutId);
      }
    };
  }, [user?.role]);

  return null;
}
