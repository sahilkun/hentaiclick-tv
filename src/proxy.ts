import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ALLOWED_ORIGINS = new Set([
  "https://hentaiclick.tv",
  "https://www.hentaiclick.tv",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // CORS protection for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    // Block cross-origin requests
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "https://hentaiclick.tv",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
