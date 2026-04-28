import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

/**
 * PATCH /api/admin/users
 *
 * Update a user's role or premium status. Body: { id, role?, is_premium? }
 * Admin-only — uses the service-role client so it bypasses RLS recursion.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  let body: { id?: string; role?: string; is_premium?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!["user", "moderator", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    update.role = body.role;
  }
  if (body.is_premium !== undefined) {
    update.is_premium = !!body.is_premium;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", body.id)
    .select("id, role, is_premium")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
