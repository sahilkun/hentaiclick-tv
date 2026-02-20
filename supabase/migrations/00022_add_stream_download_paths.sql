-- Replace cdn_slug / download_cdn_slug / download_filename with simple path columns
-- stream_path: e.g. "natsu-no-hako-01" (the folder on CDN, quality subfolder appended automatically)
-- download_path: e.g. "natsu-to-haku-01/Natsu-to-Hako-01" (folder/filename without quality suffix)

-- Add new columns
alter table public.episodes
  add column stream_path text not null default '',
  add column download_path text not null default '';

-- Migrate existing data
update public.episodes
  set stream_path = cdn_slug,
      download_path = case
        when download_cdn_slug != '' and download_filename != ''
        then download_cdn_slug || '/' || download_filename
        when download_cdn_slug != ''
        then download_cdn_slug
        else ''
      end;

-- Drop old columns
alter table public.episodes
  drop column cdn_slug,
  drop column download_cdn_slug,
  drop column download_filename;
