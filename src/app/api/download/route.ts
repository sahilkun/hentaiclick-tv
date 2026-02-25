import { NextRequest, NextResponse } from "next/server";
import { CDN_DOWNLOAD_BASE, CDN_STREAM_BASE } from "@/lib/constants";
import { sanitizeFilename } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/** Build CDN allowlist from environment-configured bases. */
function getAllowedCdnBases(): string[] {
  const bases: string[] = [];
  if (CDN_DOWNLOAD_BASE) bases.push(CDN_DOWNLOAD_BASE);
  if (CDN_STREAM_BASE) bases.push(CDN_STREAM_BASE);
  return bases;
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

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Proxy download from CDN with Content-Disposition: attachment header.
 *
 * Usage:
 *   /api/download?url=https://cdn.example.com/path/to/file.mkv
 *   /api/download?path=path/to/file.mkv  (legacy, prepends CDN base)
 *   /api/download?token=TURNSTILE_TOKEN  (required for guest downloads)
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(`download:${ip}`, 30, 60_000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const urlParam = request.nextUrl.searchParams.get("url");
  const pathParam = request.nextUrl.searchParams.get("path");
  const turnstileToken = request.nextUrl.searchParams.get("token");

  // Verify Turnstile token if provided (guest downloads)
  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken);
    if (!valid) {
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 403 }
      );
    }
  }

  let cdnUrl: string;
  const allowedBases = getAllowedCdnBases();

  if (urlParam) {
    // Full URL provided — validate it points to an allowed CDN
    const isAllowed = allowedBases.some((base) =>
      urlParam.startsWith(base + "/")
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Invalid download URL" },
        { status: 400 }
      );
    }
    cdnUrl = urlParam;
  } else if (pathParam) {
    // Legacy relative path — sanitize and prepend CDN base
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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const cdnResponse = await fetch(cdnUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!cdnResponse.ok) {
      return NextResponse.json(
        { error: "File not found on CDN" },
        { status: cdnResponse.status }
      );
    }

    // Extract and sanitize filename from the URL for Content-Disposition
    const rawFilename =
      cdnUrl.split("/").pop()?.split("?")[0] || "download.mkv";
    const filename = sanitizeFilename(rawFilename);

    // Stream the response back with download headers
    return new NextResponse(cdnResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": cdnResponse.headers.get("Content-Length") || "",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from CDN" },
      { status: 502 }
    );
  }
}
