-- repoint-episodes-to-r2.sql
--
-- For every episode in :slug_list (passed as a text[] of slugs), rewrite
-- the CDN-pointing fields from pushr.io's r-cdn.com (or relative paths)
-- to absolute https://cdn.hentaiclick.tv URLs, after backing up the old
-- values into _migration_backup_episodes.
--
-- Idempotent: re-running on an already-migrated row is a no-op because:
--   * "https://cdn.hentaiclick.tv/..." values pass through unchanged
--     (the CASE on relative-paths uses NOT LIKE 'https://%')
--   * REPLACE on poster_url etc. that's already on cdn.hentaiclick.tv
--     is a no-op (no pushr substring to match)
--   * The backup INSERT uses ON CONFLICT DO NOTHING so old backups stay
--
-- Run with: psql ... -v slug_list="'{slug1,slug2,...}'"
-- or just hardcode the list in a wrapper script.

\set ON_ERROR_STOP on
BEGIN;

-- Backup the rows we're about to modify (first time only)
INSERT INTO _migration_backup_episodes
  (slug, stream_links, download_links, subtitle_links,
   thumbnail_path, poster_url, thumbnail_url, gallery_urls)
SELECT slug, stream_links, download_links, subtitle_links,
       thumbnail_path, poster_url, thumbnail_url, gallery_urls
FROM episodes
WHERE slug = ANY(:'slug_list'::text[])
ON CONFLICT (slug) DO NOTHING;

UPDATE episodes SET
  stream_links = COALESCE((
    SELECT jsonb_object_agg(
      key,
      CASE
        WHEN value LIKE 'https://%' THEN value
        ELSE 'https://cdn.hentaiclick.tv/' || value
      END
    )
    FROM jsonb_each_text(stream_links)
  ), stream_links),

  download_links = COALESCE((
    SELECT jsonb_object_agg(
      key,
      CASE
        WHEN value LIKE 'https://%' THEN value
        ELSE 'https://cdn.hentaiclick.tv/' || value
      END
    )
    FROM jsonb_each_text(download_links)
  ), download_links),

  subtitle_links = COALESCE((
    SELECT jsonb_object_agg(
      key,
      CASE
        WHEN value LIKE 'https://%' THEN value
        ELSE 'https://cdn.hentaiclick.tv/' || value
      END
    )
    FROM jsonb_each_text(subtitle_links)
  ), subtitle_links),

  thumbnail_path = CASE
    WHEN thumbnail_path LIKE 'https://%' THEN thumbnail_path
    ELSE 'https://cdn.hentaiclick.tv/' || thumbnail_path
  END,

  poster_url = REPLACE(
    poster_url,
    'https://c6149z6672.r-cdn.com/',
    'https://cdn.hentaiclick.tv/'
  ),

  thumbnail_url = REPLACE(
    thumbnail_url,
    'https://c6149z6672.r-cdn.com/',
    'https://cdn.hentaiclick.tv/'
  ),

  gallery_urls = ARRAY(
    SELECT REPLACE(
      g,
      'https://c6149z6672.r-cdn.com/',
      'https://cdn.hentaiclick.tv/'
    )
    FROM unnest(gallery_urls) g
  )
WHERE slug = ANY(:'slug_list'::text[]);

-- Quick summary of what changed
SELECT slug,
       stream_links->>'master' AS master,
       poster_url
FROM episodes
WHERE slug = ANY(:'slug_list'::text[])
ORDER BY slug;

COMMIT;
