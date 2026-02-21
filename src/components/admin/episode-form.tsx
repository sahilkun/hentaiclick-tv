"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  QUALITY_LEVELS,
  CDN_STREAM_BASE,
  CDN_DOWNLOAD_BASE,
} from "@/lib/constants";
import type { Episode } from "@/types";
import slugify from "slugify";

interface GenreOption {
  id: string;
  name: string;
  slug: string;
  is_subgenre: boolean;
  parent_genre_id: string | null;
}

interface StudioOption {
  id: string;
  name: string;
}

interface EpisodeFormProps {
  episode?: Episode;
  series: { id: string; title: string }[];
  genres: GenreOption[];
  studios: StudioOption[];
  initialGenreIds?: string[];
  initialStudioId?: string | null;
}

export function EpisodeForm({
  episode,
  series,
  genres,
  studios,
  initialGenreIds = [],
  initialStudioId,
}: EpisodeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!episode;

  const [form, setForm] = useState({
    title: episode?.title ?? "",
    slug: episode?.slug ?? "",
    description: episode?.description ?? "",
    series_id: episode?.series_id ?? "",
    studio_id: initialStudioId ?? episode?.studio_id ?? "",
    season_no: episode?.season_no ?? 1,
    episode_no: episode?.episode_no ?? 1,
    stream_links: (episode?.stream_links ?? {}) as Record<string, string>,
    download_links: (episode?.download_links ?? {}) as Record<string, string>,
    subtitle_links: (episode?.subtitle_links ?? {}) as Record<string, string>,
    thumbnail_path: episode?.thumbnail_path ?? "",
    poster_url: episode?.poster_url ?? "",
    thumbnail_url: episode?.thumbnail_url ?? "",
    gallery_urls: episode?.gallery_urls?.join("\n") ?? "",
    duration_seconds: episode?.duration_seconds ?? 0,
    release_date: episode?.release_date ?? "",
    status: episode?.status ?? "draft",
    meta_title: episode?.meta_title ?? "",
    meta_description: episode?.meta_description ?? "",
  });

  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(
    initialGenreIds
  );
  const [genreSearch, setGenreSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Group genres: main genres and sub-genres
  const mainGenres = genres.filter((g) => !g.is_subgenre);
  const subGenres = genres.filter((g) => g.is_subgenre);

  // Filter genres for the search/dropdown
  const filteredGenres = genres.filter(
    (g) =>
      !selectedGenreIds.includes(g.id) &&
      g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const selectedGenres = genres.filter((g) => selectedGenreIds.includes(g.id));

  const toggleGenre = (genreId: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setGenreSearch("");
  };

  const removeGenre = (genreId: string) => {
    setSelectedGenreIds((prev) => prev.filter((id) => id !== genreId));
  };

  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: isEdit
        ? form.slug
        : slugify(title, { lower: true, strict: true }),
    });
  };

  /** Strip empty-value keys before saving to DB */
  const cleanLinks = (obj: Record<string, string>) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v.trim() !== ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      series_id: form.series_id || null,
      studio_id: form.studio_id || null,
      season_no: form.season_no,
      episode_no: form.episode_no,
      stream_links: cleanLinks(form.stream_links),
      download_links: cleanLinks(form.download_links),
      subtitle_links: cleanLinks(form.subtitle_links),
      thumbnail_path: form.thumbnail_path.trim(),
      gallery_urls: form.gallery_urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
      poster_url: form.poster_url || null,
      thumbnail_url: form.thumbnail_url || null,
      duration_seconds: form.duration_seconds,
      release_date: form.release_date || null,
      status: form.status,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    };

    let episodeId = episode?.id;

    if (isEdit) {
      const { error } = await supabase
        .from("episodes")
        .update(payload)
        .eq("id", episode!.id);

      if (error) {
        toast(error.message, "error");
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("episodes")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        toast(error.message, "error");
        setSaving(false);
        return;
      }
      episodeId = data.id;
    }

    // Save episode genres (delete all then re-insert)
    if (episodeId) {
      await supabase
        .from("episode_genres")
        .delete()
        .eq("episode_id", episodeId);

      if (selectedGenreIds.length > 0) {
        const genreRows = selectedGenreIds.map((genre_id) => ({
          episode_id: episodeId!,
          genre_id,
        }));
        const { error: genreError } = await supabase
          .from("episode_genres")
          .insert(genreRows);

        if (genreError) {
          console.error("Error saving genres:", genreError);
        }
      }
    }

    toast(isEdit ? "Episode updated" : "Episode created", "success");
    router.push("/admin/episodes");
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

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          rows={4}
          placeholder="Episode description..."
        />
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

      {/* Studio */}
      <div>
        <label className="mb-1 block text-sm font-medium">Studio</label>
        <NativeSelect
          value={form.studio_id}
          onChange={(e) => setForm({ ...form, studio_id: e.target.value })}
        >
          <option value="">No Studio</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* Genres */}
      <div>
        <label className="mb-1 block text-sm font-medium">Genres</label>

        {/* Selected genres */}
        {selectedGenres.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedGenres.map((genre) => (
              <span
                key={genre.id}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  genre.is_subgenre
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {genre.name}
                <button
                  type="button"
                  onClick={() => removeGenre(genre.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Genre search input */}
        <Input
          value={genreSearch}
          onChange={(e) => setGenreSearch(e.target.value)}
          placeholder="Search genres..."
          className="mb-2"
        />

        {/* Genre list */}
        <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background p-2">
          {mainGenres.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                Genres
              </p>
              <div className="flex flex-wrap gap-1">
                {mainGenres
                  .filter((g) =>
                    g.name
                      .toLowerCase()
                      .includes(genreSearch.toLowerCase())
                  )
                  .map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selectedGenreIds.includes(genre.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {subGenres.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                Sub-genres
              </p>
              <div className="flex flex-wrap gap-1">
                {subGenres
                  .filter((g) =>
                    g.name
                      .toLowerCase()
                      .includes(genreSearch.toLowerCase())
                  )
                  .map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selectedGenreIds.includes(genre.id)
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {filteredGenres.length === 0 && genreSearch && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No genres found
            </p>
          )}
        </div>
      </div>

      {/* CDN Links (per quality) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold">CDN Links</h3>

        {/* Thumbnail Path */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Thumbnail Path (seek preview)
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">
              {CDN_STREAM_BASE}/
            </span>
            <Input
              value={form.thumbnail_path}
              onChange={(e) =>
                setForm({ ...form, thumbnail_path: e.target.value })
              }
              placeholder="natsu-no-hako-01/720/thumbs/thumbs.vtt"
            />
          </div>
        </div>

        {/* Per-quality link groups */}
        {QUALITY_LEVELS.filter((q) => q !== 480).map((q) => (
          <div
            key={q}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <h4 className="text-xs font-bold text-muted-foreground">
              {q === 2160 ? "4K (2160p)" : `${q}p`}
            </h4>

            {/* Stream link */}
            <div>
              <label className="mb-1 block text-xs font-medium">Stream</label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {CDN_STREAM_BASE}/
                </span>
                <Input
                  value={form.stream_links[String(q)] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stream_links: {
                        ...form.stream_links,
                        [String(q)]: e.target.value,
                      },
                    })
                  }
                  placeholder={`path/${q}/index.m3u8`}
                />
              </div>
            </div>

            {/* Subtitle link */}
            <div>
              <label className="mb-1 block text-xs font-medium">
                Subtitle
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {CDN_STREAM_BASE}/
                </span>
                <Input
                  value={form.subtitle_links[String(q)] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subtitle_links: {
                        ...form.subtitle_links,
                        [String(q)]: e.target.value,
                      },
                    })
                  }
                  placeholder={`path/${q}/index_vtt.m3u8`}
                />
              </div>
            </div>

            {/* Download link */}
            <div>
              <label className="mb-1 block text-xs font-medium">
                Download
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {CDN_DOWNLOAD_BASE}/
                </span>
                <Input
                  value={form.download_links[String(q)] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      download_links: {
                        ...form.download_links,
                        [String(q)]: e.target.value,
                      },
                    })
                  }
                  placeholder={`folder/file-${q}p.mkv`}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Auto-derived qualities summary */}
        <div className="text-xs text-muted-foreground">
          Stream:{" "}
          {QUALITY_LEVELS.filter(
            (q) => form.stream_links[String(q)]?.trim()
          )
            .map((q) => `${q}p`)
            .join(", ") || "none"}{" "}
          &middot; Download:{" "}
          {QUALITY_LEVELS.filter(
            (q) => form.download_links[String(q)]?.trim()
          )
            .map((q) => `${q}p`)
            .join(", ") || "none"}
        </div>
      </div>

      {/* Media URLs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Poster URL
          </label>
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
          placeholder={"https://cdn.example.com/img1.jpg\nhttps://cdn.example.com/img2.jpg"}
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
              setForm({
                ...form,
                duration_seconds: Number(e.target.value),
              })
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
