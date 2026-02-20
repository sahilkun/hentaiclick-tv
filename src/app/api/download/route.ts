import { NextRequest, NextResponse } from "next/server";
import { CDN_DOWNLOAD_BASE } from "@/lib/constants";

/**
 * Proxy download from CDN with Content-Disposition: attachment header.
 * This forces the browser to download the file instead of playing it.
 *
 * Usage: /api/download?path=natsu-to-haku-01/Natsu-to-Hako-01-1080p.mkv
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  // Sanitize path — prevent directory traversal
  if (path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const cdnUrl = `${CDN_DOWNLOAD_BASE}/${path}`;

  try {
    const cdnResponse = await fetch(cdnUrl);

    if (!cdnResponse.ok) {
      return NextResponse.json(
        { error: "File not found on CDN" },
        { status: cdnResponse.status }
      );
    }

    // Extract filename from the path for Content-Disposition
    const filename = path.split("/").pop() || "download.mkv";

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
