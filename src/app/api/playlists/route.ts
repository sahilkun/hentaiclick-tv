import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import slugify from "slugify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const isPublic = searchParams.get("public") === "true";

  const supabase = await createClient();

  let query = supabase
    .from("playlists")
    .select("*, user:profiles!playlists_user_id_profiles_fk (username, display_name)")
    .order("created_at", { ascending: false });

  if (isPublic) {
    query = query.eq("is_public", true);
  } else if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch playlists:", error.message);
    return NextResponse.json({ error: "Failed to load playlists" }, { status: 500 });
  }

  return NextResponse.json({ playlists: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, is_public } = await request.json();

  if (!title || title.length > 100) {
    return NextResponse.json(
      { error: "Title required (max 100 chars)" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(title, { lower: true, strict: true });
  const suffix = user.id.slice(0, 8);
  const slug = `${baseSlug}-${suffix}`;

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: user.id,
      title,
      slug,
      is_public: is_public ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create playlist:", error.message);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }

  return NextResponse.json({ playlist: data });
}
