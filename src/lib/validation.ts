import { NextResponse } from "next/server";

/** Validate a string is a valid UUID v4 format. */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

/**
 * Validate and sanitize a redirect path.
 * Returns "/" if the path is invalid or could redirect off-site.
 */
export function isValidRedirect(path: string | null): string {
  if (!path) return "/";
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  if (path.includes("://")) return "/";
  return path;
}

/**
 * Sanitize a filename for use in Content-Disposition headers.
 * Strips dangerous characters that could cause header injection.
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      .replace(/["\r\n]/g, "")
      .replace(/[^\w.\-]/g, "_")
      .slice(0, 255) || "download"
  );
}

/**
 * Strip double-quotes from a value before MeiliSearch filter interpolation.
 * Prevents filter injection via crafted genre/studio slugs.
 */
export function escapeMeiliFilter(value: string): string {
  return value.replace(/[^a-zA-Z0-9_\- ]/g, "");
}

/** Validate a URL uses http or https protocol. */
export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse JSON body from a request, validating Content-Type header.
 * Returns the parsed body or a NextResponse error.
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<T | NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 }
    );
  }
  return request.json() as Promise<T>;
}

/** Type guard for parseJsonBody — true if the result is an error response. */
export function isParseError<T>(
  result: T | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Validate the Origin/Referer header matches the site URL.
 * Returns a 403 NextResponse if the check fails, or null if OK.
 * Should be called on all state-changing (POST/PATCH/DELETE) routes.
 */
export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Allow same-origin requests (server-side calls have no origin)
  if (!origin && !referer) return null;

  const allowed = [siteUrl, "http://localhost:3000", "http://localhost:3001"].filter(Boolean);

  if (origin && allowed.some((u) => origin.startsWith(u))) return null;
  if (referer && allowed.some((u) => referer.startsWith(u))) return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Sanitize user-generated text by stripping HTML tags.
 * Prevents stored XSS if content is ever rendered as HTML.
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Allowed CDN hostnames for user-facing image/download URLs. */
const ALLOWED_CDN_HOSTS = new Set([
  "cdn.rootserver1.com",
  "cdn.rootserver2.com",
  "c6149z6464.r-cdn.com",
  "c6149z6465.r-cdn.com",
]);

/** Validate a URL uses https and points to an allowed CDN hostname. */
export function isAllowedCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_CDN_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
