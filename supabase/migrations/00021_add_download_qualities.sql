-- Separate download qualities from streaming qualities
-- Downloads typically only available in 1080p and 2160p
alter table public.episodes
  add column download_qualities integer[] not null default '{1080, 2160}';
