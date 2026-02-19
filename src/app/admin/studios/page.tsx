"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import slugify from "slugify";

interface Studio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export default function AdminStudiosPage() {
  const { toast } = useToast();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Studio | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo_url: "",
    description: "",
  });

  const fetchStudios = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("studios")
      .select("*")
      .order("name");
    setStudios((data as Studio[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudios();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", logo_url: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (studio: Studio) => {
    setEditing(studio);
    setForm({
      name: studio.name,
      slug: studio.slug,
      logo_url: studio.logo_url || "",
      description: studio.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name, { lower: true, strict: true }),
      logo_url: form.logo_url || null,
      description: form.description || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("studios")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Studio updated", "success");
        setModalOpen(false);
        fetchStudios();
      }
    } else {
      const { error } = await supabase.from("studios").insert(payload);
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Studio created", "success");
        setModalOpen(false);
        fetchStudios();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (studio: Studio) => {
    if (!confirm(`Delete studio "${studio.name}"? This cannot be undone.`))
      return;

    const supabase = createClient();
    const { error } = await supabase
      .from("studios")
      .delete()
      .eq("id", studio.id);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Studio deleted", "success");
      fetchStudios();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Studios</h1>
        <Button onClick={openCreate}>Add Studio</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Logo</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studios.map((studio) => (
                <tr
                  key={studio.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{studio.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {studio.slug}
                  </td>
                  <td className="px-4 py-3">
                    {studio.logo_url ? (
                      <span className="text-xs text-green-600">Yes</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(studio)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(studio)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {studios.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No studios yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>{editing ? "Edit Studio" : "Add Studio"}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated from name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Logo URL
              </label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name}>
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
