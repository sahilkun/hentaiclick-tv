"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import slugify from "slugify";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}

export default function AdminPagesPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const fetchPages = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_pages")
      .select("*")
      .order("slug");
    setPages((data as SitePage[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_pages")
      .insert({
        title: newTitle,
        slug: newSlug || slugify(newTitle, { lower: true, strict: true }),
        content: "",
      })
      .select("id")
      .single();

    if (error) {
      toast(error.message, "error");
    } else if (data) {
      toast("Page created", "success");
      setCreateOpen(false);
      setNewTitle("");
      setNewSlug("");
      fetchPages();
    }
    setSaving(false);
  };

  const handleDelete = async (page: SitePage) => {
    if (!confirm(`Delete page "${page.title}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("site_pages")
      .delete()
      .eq("id", page.id);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Page deleted", "success");
      fetchPages();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Pages</h1>
        <Button onClick={() => setCreateOpen(true)}>New Page</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{page.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    /{page.slug}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/pages/${page.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(page)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No pages yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <ModalHeader>
          <ModalTitle>New Page</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. How to Get Premium"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="auto-generated from title"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !newTitle}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
