import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Role = "admin" | "moderator" | "user";

interface AuthResult {
  userId: string;
  role: Role;
}

/**
 * Verify the current user is authenticated and has one of the required roles.
 * Returns the user's ID and role on success, or a NextResponse error to return early.
 */
export async function requireRole(
  ...allowedRoles: Role[]
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id, role: profile.role as Role };
}

/** Shorthand: require admin role. */
export async function requireAdmin() {
  return requireRole("admin");
}

/** Shorthand: require admin or moderator role. */
export async function requireModerator() {
  return requireRole("admin", "moderator");
}

/** Type guard to check if requireRole returned an error response. */
export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
