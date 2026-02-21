import { NextRequest, NextResponse } from "next/server";
import { CDN_DOWNLOAD_BASE } from "@/lib/constants";

/**
 * Proxy download from CDN with Content-Disposition: attachment header.
 * This forces the browser to download the file instead of playing it.
 *
 * Usage:
 *   /api/download?url=https://cdn.rootserver1.com/path/to/file.mkv
 *   /api/download?path=path/to/file.mkv  (legacy, prepends CDN base)
 */
export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  const pathParam = request.nextUrl.searchParams.get("path");

  let cdnUrl: string;

  if (urlParam) {
    // Full URL provided — validate it points to an allowed CDN
    if (
      !urlParam.startsWith("https://cdn.rootserver1.com/") &&
      !urlParam.startsWith("https://cdn.rootserver2.com/")
    ) {
      return NextResponse.json(
        { error: "Invalid download URL" },
        { status: 400 }
      );
    }
    cdnUrl = urlParam;
  } else if (pathParam) {
    // Legacy relative path — sanitize and prepend CDN base
    if (pathParam.includes("..") || pathParam.startsWith("/")) {
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
    const cdnResponse = await fetch(cdnUrl);

    if (!cdnResponse.ok) {
      return NextResponse.json(
        { error: "File not found on CDN" },
        { status: cdnResponse.status }
      );
    }

    // Extract filename from the URL for Content-Disposition
    const filename =
      cdnUrl.split("/").pop()?.split("?")[0] || "download.mkv";

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
