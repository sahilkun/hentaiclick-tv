alter table public.episodes
  add column download_cdn_slug text not null default '';
