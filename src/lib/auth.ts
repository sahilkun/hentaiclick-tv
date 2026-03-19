import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Role = "admin" | "moderator" | "user";

interface AuthResult {
  userId: string;
  role: Role;
}

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

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireModerator() {
  return requireRole("admin", "moderator");
}

export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
