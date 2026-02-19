import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_pages")
    .select("meta_title, meta_description")
    .eq("slug", "premium")
    .single();

  return {
    title: data?.meta_title ?? "How to Get Premium",
    description: data?.meta_description,
  };
}

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("site_pages")
    .select("*")
    .eq("slug", "premium")
    .single();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        {page ? (
          <>
            <h1>{page.title}</h1>
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </>
        ) : (
          <>
            <h1>How to Get Premium</h1>
            <p>Premium page content has not been configured yet.</p>
          </>
        )}
      </article>
    </div>
  );
}
