import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { CDN_DOWNLOAD_BASE, CDN_STREAM_BASE } from "@/lib/constants";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  checkDownloadQuota,
  logDownloadEvent,
  FREE_DAILY_LIMIT,
} from "@/lib/download-quota";

/** Build CDN allowlist from environment-configured bases. */
function getAllowedCdnBases(): string[] {
  const bases: string[] = [];
  if (CDN_DOWNLOAD_BASE) bases.push(CDN_DOWNLOAD_BASE);
  if (CDN_STREAM_BASE) bases.push(CDN_STREAM_BASE);
  return bases;
}

/** Hash an IP with the secret salt for privacy-preserving quota tracking. */
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "";
  return createHash("sha256").update(salt + ip).digest("hex");
}

/** Verify Turnstile token for guest downloads. */
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Skip if not configured

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Resolve a download request to a CDN URL.
 *
 * Auth flow:
 *   1. Rate-limit by IP
 *   2. Validate target URL is in CDN allowlist
 *   3. Authenticated user → skip captcha. Guest → require valid Turnstile token.
 *   4. Premium/admin/moderator → redirect to CDN (no quota)
 *   5. Free user → check daily quota & concurrency, log event, then redirect
 *
 * The CDN serves the bytes directly — the app server never streams the file.
 *
 * Usage:
 *   /api/download?url=https://cdn.example.com/path/to/file.mkv
 *   /api/download?path=path/to/file.mkv  (legacy, prepends CDN_DOWNLOAD_BASE)
 *   /api/download?token=TURNSTILE_TOKEN  (required for guests)
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`download:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const urlParam = request.nextUrl.searchParams.get("url");
  const pathParam = request.nextUrl.searchParams.get("path");
  const turnstileToken = request.nextUrl.searchParams.get("token");

  // ---- Resolve target URL ----
  let cdnUrl: string;
  const allowedBases = getAllowedCdnBases();

  if (urlParam) {
    const isAllowed = allowedBases.some((base) =>
      urlParam.startsWith(base + "/")
    );
    if (!isAllowed) {
      return NextResponse.json({ error: "Invalid download URL" }, { status: 400 });
    }
    cdnUrl = urlParam;
  } else if (pathParam) {
    const decoded = decodeURIComponent(pathParam);
    if (decoded.includes("..") || decoded.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    cdnUrl = `${CDN_DOWNLOAD_BASE}/${pathParam}`;
  } else {
    return NextResponse.json(
      { error: "Missing url or path parameter" },
      { status: 400 }
    );
  }

  // ---- Auth ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests must pass captcha
  if (!user) {
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Captcha verification required for guest downloads" },
        { status: 403 }
      );
    }
    const valid = await verifyTurnstile(turnstileToken);
    if (!valid) {
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 403 }
      );
    }
  }

  // ---- Premium check (skip quota for premium/admin/mod) ----
  let isPrivileged = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_premium")
      .eq("id", user.id)
      .single();
    if (profile) {
      isPrivileged =
        profile.role === "admin" ||
        profile.role === "moderator" ||
        profile.is_premium === true;
    }
  }

  // ---- Quota & concurrency for non-privileged users ----
  if (!isPrivileged) {
    const ipHash = hashIp(ip);
    const admin = getAdminClient();
    const quota = await checkDownloadQuota({
      supabase: admin,
      userId: user?.id ?? null,
      ipHash,
    });

    if (!quota.ok) {
      const message =
        quota.reason === "daily"
          ? `Daily download limit reached (${FREE_DAILY_LIMIT} per day). Upgrade to premium for unlimited downloads.`
          : "You already have a download in progress. Wait for it to finish, or upgrade to premium for unlimited concurrent downloads.";
      return NextResponse.json(
        {
          error: message,
          reason: quota.reason,
          retryAfterSeconds: quota.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(quota.retryAfterSeconds) },
        }
      );
    }

    // Log event before redirect so parallel requests count it
    await logDownloadEvent({
      supabase: admin,
      userId: user?.id ?? null,
      ipHash,
      downloadUrl: cdnUrl,
    });
  }

  // ---- Return CDN URL (no proxy, no double egress) ----
  // Frontend calls this via fetch and navigates to `url` to start the actual download.
  return NextResponse.json({ url: cdnUrl });
}
