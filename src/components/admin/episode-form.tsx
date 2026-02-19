"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { QUALITY_LEVELS, CDN_STREAM_BASE, CDN_DOWNLOAD_BASE } from "@/lib/constants";
import type { Episode } from "@/types";
import slugify from "slugify";

interface EpisodeFormProps {
  episode?: Episode;
  series: { id: string; title: string }[];
}

export function EpisodeForm({ episode, series }: EpisodeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!episode;

  const [form, setForm] = useState({
    title: episode?.title ?? "",
    slug: episode?.slug ?? "",
    series_id: episode?.series_id ?? "",
    season_no: episode?.season_no ?? 1,
    episode_no: episode?.episode_no ?? 1,
    cdn_slug: episode?.cdn_slug ?? "",
    download_filename: episode?.download_filename ?? "",
    available_qualities: episode?.available_qualities ?? [720, 1080],
    poster_url: episode?.poster_url ?? "",
    thumbnail_url: episode?.thumbnail_url ?? "",
    gallery_urls: episode?.gallery_urls?.join("\n") ?? "",
    duration_seconds: episode?.duration_seconds ?? 0,
    release_date: episode?.release_date ?? "",
    status: episode?.status ?? "draft",
    meta_title: episode?.meta_title ?? "",
    meta_description: episode?.meta_description ?? "",
  });

  const [saving, setSaving] = useState(false);

  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: isEdit ? form.slug : slugify(title, { lower: true, strict: true }),
    });
  };

  const handleQualityToggle = (quality: number) => {
    setForm({
      ...form,
      available_qualities: form.available_qualities.includes(quality)
        ? form.available_qualities.filter((q) => q !== quality)
        : [...form.available_qualities, quality].sort((a, b) => a - b),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = {
      ...form,
      gallery_urls: form.gallery_urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
      series_id: form.series_id || null,
      poster_url: form.poster_url || null,
      thumbnail_url: form.thumbnail_url || null,
      release_date: form.release_date || null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("episodes")
        .update(payload)
        .eq("id", episode!.id);

      if (error) {
        toast(error.message, "error");
      } else {
        toast("Episode updated", "success");
        router.push("/admin/episodes");
      }
    } else {
      const { error } = await supabase.from("episodes").insert(payload);

      if (error) {
        toast(error.message, "error");
      } else {
        toast("Episode created", "success");
        router.push("/admin/episodes");
      }
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Title & Slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <Input
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Series, Season, Episode */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Series</label>
          <NativeSelect
            value={form.series_id}
            onChange={(e) =>
              setForm({ ...form, series_id: e.target.value })
            }
          >
            <option value="">No Series</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Season #</label>
          <Input
            type="number"
            min={1}
            value={form.season_no}
            onChange={(e) =>
              setForm({ ...form, season_no: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Episode #</label>
          <Input
            type="number"
            min={1}
            value={form.episode_no}
            onChange={(e) =>
              setForm({ ...form, episode_no: Number(e.target.value) })
            }
          />
        </div>
      </div>

      {/* CDN */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold">CDN Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">CDN Slug</label>
            <Input
              value={form.cdn_slug}
              onChange={(e) =>
                setForm({ ...form, cdn_slug: e.target.value })
              }
              required
              placeholder="series-name/episode-01"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Download Filename
            </label>
            <Input
              value={form.download_filename}
              onChange={(e) =>
                setForm({ ...form, download_filename: e.target.value })
              }
              placeholder="Series-Name-Episode-01"
            />
          </div>
        </div>

        {/* Preview URLs */}
        {form.cdn_slug && (
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p>
              Stream: {CDN_STREAM_BASE}/{form.cdn_slug}/1080/index.m3u8
            </p>
            {form.download_filename && (
              <p>
                Download: {CDN_DOWNLOAD_BASE}/{form.cdn_slug}/
                {form.download_filename}-1080p.mkv
              </p>
            )}
          </div>
        )}
      </div>

      {/* Qualities */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Available Qualities
        </label>
        <div className="flex gap-3">
          {QUALITY_LEVELS.map((q) => (
            <label
              key={q}
              className="flex items-center gap-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={form.available_qualities.includes(q)}
                onChange={() => handleQualityToggle(q)}
                className="accent-primary"
              />
              {q}p
            </label>
          ))}
        </div>
      </div>

      {/* Media URLs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Poster URL</label>
          <Input
            value={form.poster_url}
            onChange={(e) =>
              setForm({ ...form, poster_url: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Thumbnail URL
          </label>
          <Input
            value={form.thumbnail_url}
            onChange={(e) =>
              setForm({ ...form, thumbnail_url: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Gallery */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Gallery URLs (one per line)
        </label>
        <Textarea
          value={form.gallery_urls}
          onChange={(e) =>
            setForm({ ...form, gallery_urls: e.target.value })
          }
          rows={4}
          placeholder="https://cdn.example.com/img1.jpg&#10;https://cdn.example.com/img2.jpg"
        />
      </div>

      {/* Duration, Release Date, Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Duration (seconds)
          </label>
          <Input
            type="number"
            min={0}
            value={form.duration_seconds}
            onChange={(e) =>
              setForm({ ...form, duration_seconds: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Release Date
          </label>
          <Input
            type="date"
            value={form.release_date}
            onChange={(e) =>
              setForm({ ...form, release_date: e.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <NativeSelect
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as Episode["status"],
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </NativeSelect>
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold">SEO</h3>
        <Input
          value={form.meta_title}
          onChange={(e) =>
            setForm({ ...form, meta_title: e.target.value })
          }
          placeholder="Meta Title"
        />
        <Textarea
          value={form.meta_description}
          onChange={(e) =>
            setForm({ ...form, meta_description: e.target.value })
          }
          placeholder="Meta Description"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving
          ? "Saving..."
          : isEdit
            ? "Update Episode"
            : "Create Episode"}
      </Button>
    </form>
  );
}
