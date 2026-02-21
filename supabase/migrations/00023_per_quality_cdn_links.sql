-- Migration: Replace stream_path/download_path with per-quality JSONB link maps
-- stream_links: {"720": "path/720/index.m3u8", "1080": "path/1080/index.m3u8"}
-- download_links: {"1080": "folder/file-1080p.mkv"}
-- subtitle_links: {"720": "path/720/index_vtt.m3u8"}
-- thumbnail_path: "path/720/thumbs/thumbs.vtt"

-- 1. Add new columns
ALTER TABLE public.episodes
  ADD COLUMN stream_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN download_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN subtitle_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN thumbnail_path text NOT NULL DEFAULT '';

-- 2. Migrate stream_path + available_qualities → stream_links & subtitle_links
UPDATE public.episodes SET
  stream_links = COALESCE(
    (SELECT jsonb_object_agg(q::text, stream_path || '/' || q || '/index.m3u8')
     FROM unnest(available_qualities) AS q),
    '{}'::jsonb
  ),
  subtitle_links = COALESCE(
    (SELECT jsonb_object_agg(q::text, stream_path || '/' || q || '/index_vtt.m3u8')
     FROM unnest(available_qualities) AS q),
    '{}'::jsonb
  ),
  thumbnail_path = CASE
    WHEN stream_path != '' AND array_length(available_qualities, 1) > 0
    THEN stream_path || '/' || available_qualities[1] || '/thumbs/thumbs.vtt'
    ELSE ''
  END
WHERE stream_path IS NOT NULL AND stream_path != '';

-- 3. Migrate download_path + download_qualities → download_links
UPDATE public.episodes SET
  download_links = COALESCE(
    (SELECT jsonb_object_agg(q::text, download_path || '-' || q || 'p.mkv')
     FROM unnest(download_qualities) AS q),
    '{}'::jsonb
  )
WHERE download_path IS NOT NULL AND download_path != '';

-- 4. Drop old columns
ALTER TABLE public.episodes
  DROP COLUMN stream_path,
  DROP COLUMN download_path,
  DROP COLUMN available_qualities,
  DROP COLUMN download_qualities;
