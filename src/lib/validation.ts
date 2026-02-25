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
  return value.replace(/"/g, "");
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
