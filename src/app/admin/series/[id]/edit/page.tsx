"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import slugify from "slugify";

export default function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    cover_url: "",
    status: "ongoing",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    const fetchSeries = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("series")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          cover_url: data.cover_url || "",
          status: data.status || "ongoing",
          year: data.year || new Date().getFullYear(),
        });
      }
      setLoading(false);
    };
    fetchSeries();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("series")
      .update({
        ...form,
        slug: form.slug || slugify(form.title, { lower: true, strict: true }),
        cover_url: form.cover_url || null,
      })
      .eq("id", id);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Series updated", "success");
      router.push("/admin/series");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Edit Series</h1>
        <div className="max-w-xl space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Series</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto-generated from title"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <NativeSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
            </NativeSelect>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Year</label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm({ ...form, year: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cover URL</label>
          <Input
            value={form.cover_url}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/series")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
