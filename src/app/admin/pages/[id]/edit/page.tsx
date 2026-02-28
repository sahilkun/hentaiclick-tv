"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    const fetchPage = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          content: data.content || "",
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
        });
      }
      setLoading(false);
    };
    fetchPage();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("site_pages")
      .update({
        title: form.title,
        slug: form.slug,
        content: form.content,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      })
      .eq("id", id);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Page saved", "success");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Edit Page</h1>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Page: {form.title}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/pages")}
          >
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Meta Title
            </label>
            <Input
              value={form.meta_title}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
              placeholder="SEO title (optional)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Meta Description
            </label>
            <Input
              value={form.meta_description}
              onChange={(e) =>
                setForm({ ...form, meta_description: e.target.value })
              }
              placeholder="SEO description (optional)"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">
              Content (Markdown)
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>

          {previewMode ? (
            <div className="min-h-[400px] rounded-lg border border-border p-6">
              <article className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown>{form.content}</ReactMarkdown>
              </article>
            </div>
          ) : (
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              className="font-mono text-sm"
              placeholder="Write your page content in Markdown..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
