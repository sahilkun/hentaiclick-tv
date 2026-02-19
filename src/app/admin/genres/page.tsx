"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import slugify from "slugify";

interface Genre {
  id: string;
  name: string;
  slug: string;
  is_subgenre: boolean;
  parent_genre_id: string | null;
  created_at: string;
}

export default function AdminGenresPage() {
  const { toast } = useToast();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Genre | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    is_subgenre: false,
    parent_genre_id: "",
  });

  const fetchGenres = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("genres")
      .select("*")
      .order("name");
    setGenres((data as Genre[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const parentGenres = genres.filter((g) => !g.is_subgenre);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", is_subgenre: false, parent_genre_id: "" });
    setModalOpen(true);
  };

  const openEdit = (genre: Genre) => {
    setEditing(genre);
    setForm({
      name: genre.name,
      slug: genre.slug,
      is_subgenre: genre.is_subgenre,
      parent_genre_id: genre.parent_genre_id || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name, { lower: true, strict: true }),
      is_subgenre: form.is_subgenre,
      parent_genre_id: form.parent_genre_id || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("genres")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Genre updated", "success");
        setModalOpen(false);
        fetchGenres();
      }
    } else {
      const { error } = await supabase.from("genres").insert(payload);
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Genre created", "success");
        setModalOpen(false);
        fetchGenres();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (genre: Genre) => {
    const children = genres.filter((g) => g.parent_genre_id === genre.id);
    if (children.length > 0) {
      toast(
        "Cannot delete: this genre has subgenres. Remove them first.",
        "error"
      );
      return;
    }
    if (!confirm(`Delete genre "${genre.name}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("genres")
      .delete()
      .eq("id", genre.id);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Genre deleted", "success");
      fetchGenres();
    }
  };

  // Build nested structure for display
  const topLevel = genres.filter((g) => !g.is_subgenre);
  const getChildren = (parentId: string) =>
    genres.filter((g) => g.parent_genre_id === parentId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Genres</h1>
        <Button onClick={openCreate}>Add Genre</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topLevel.map((genre) => (
                <>
                  <tr
                    key={genre.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{genre.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {genre.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Genre
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(genre)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(genre)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                  {getChildren(genre.id).map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border bg-muted/20 last:border-0"
                    >
                      <td className="px-4 py-3 pl-8 font-medium">
                        ↳ {sub.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-secondary/50 px-2 py-0.5 text-xs text-secondary-foreground">
                          Subgenre
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(sub)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(sub)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
              {/* Orphan subgenres (parent deleted) */}
              {genres
                .filter(
                  (g) =>
                    g.is_subgenre &&
                    !genres.some((p) => p.id === g.parent_genre_id)
                )
                .map((genre) => (
                  <tr
                    key={genre.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{genre.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {genre.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-warning/10 px-2 py-0.5 text-xs text-warning">
                        Orphan Subgenre
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(genre)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(genre)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              {genres.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No genres yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>{editing ? "Edit Genre" : "Add Genre"}</ModalTitle>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_subgenre"
                checked={form.is_subgenre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_subgenre: e.target.checked,
                    parent_genre_id: e.target.checked
                      ? form.parent_genre_id
                      : "",
                  })
                }
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="is_subgenre" className="text-sm">
                This is a subgenre
              </label>
            </div>
            {form.is_subgenre && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Parent Genre
                </label>
                <NativeSelect
                  value={form.parent_genre_id}
                  onChange={(e) =>
                    setForm({ ...form, parent_genre_id: e.target.value })
                  }
                >
                  <option value="">Select parent...</option>
                  {parentGenres
                    .filter((g) => g.id !== editing?.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </NativeSelect>
              </div>
            )}
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
