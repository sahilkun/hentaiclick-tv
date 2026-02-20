import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("genres")
      .select("id, name, slug, is_subgenre, parent_genre_id")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
