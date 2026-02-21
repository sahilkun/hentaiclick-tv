import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RandomEpisodePage() {
  const supabase = await createClient();

  // Get total count of published episodes
  const { count } = await supabase
    .from("episodes")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (!count || count === 0) {
    redirect("/");
  }

  // Pick a random offset
  const randomOffset = Math.floor(Math.random() * count);

  const { data } = await supabase
    .from("episodes")
    .select("slug")
    .eq("status", "published")
    .range(randomOffset, randomOffset)
    .limit(1)
    .single();

  if (!data?.slug) {
    redirect("/");
  }

  redirect(`/episode/${data.slug}`);
}
