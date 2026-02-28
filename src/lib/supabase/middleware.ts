import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Skip auth check entirely for auth pages and public API routes — avoids
  // blocking when Supabase token refresh hangs due to clock skew or network
  // issues, and saves ~50-100ms per request on public endpoints.
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/search" ||
    pathname === "/api/genres" ||
    pathname === "/api/studios" ||
    /^\/api\/episodes\/[^/]+\/ratings$/.test(pathname)
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — treat as unauthenticated and continue
    return supabaseResponse;
  }

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    (pathname.startsWith("/profile") || pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect non-admin/moderator users away from admin routes
  if (user && pathname.startsWith("/admin")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      if (role !== "admin" && role !== "moderator") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // DB unreachable — allow through rather than blocking
    }
  }

  return supabaseResponse;
}
