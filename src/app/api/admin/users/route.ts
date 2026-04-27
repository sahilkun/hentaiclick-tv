import { NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/users
 *
 * Returns the most recent users with their auth email and profile data.
 * Admin-only — uses the service-role client to read auth.users.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const admin = getAdminClient();

  // Get profiles ordered by recent
  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (profilesErr) {
    return NextResponse.json(
      { error: profilesErr.message },
      { status: 500 }
    );
  }

  // Fetch auth users (limited to 1000 — paginate if needed later)
  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: 500 }
    );
  }

  // Build id -> email map
  const emailById = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    if (u.id && u.email) emailById.set(u.id, u.email);
  }

  // Merge
  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? null,
  }));

  return NextResponse.json({ users });
}
