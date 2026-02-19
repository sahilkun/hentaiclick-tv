create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.series(id) on delete set null,
  season_no integer not null default 1,
  episode_no integer not null default 1,
  title text not null,
  slug text unique not null,
  -- CDN
  cdn_slug text not null,
  download_filename text not null default '',
  available_qualities integer[] not null default '{720, 1080}',
  -- Media
  gallery_urls text[] default '{}',
  poster_url text,
  thumbnail_url text,
  duration_seconds integer not null default 0,
  -- Dates
  upload_date timestamptz not null default now(),
  release_date date,
  -- Status
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  -- Denormalized counters
  rating_avg numeric(3, 1) not null default 0,
  rating_count integer not null default 0,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  views_7d integer not null default 0,
  -- SEO
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_episodes_slug on public.episodes(slug);
create index idx_episodes_series on public.episodes(series_id);
create index idx_episodes_status on public.episodes(status);
create index idx_episodes_upload_date on public.episodes(upload_date desc);
create index idx_episodes_release_date on public.episodes(release_date desc nulls last);
create index idx_episodes_view_count on public.episodes(view_count desc);
create index idx_episodes_like_count on public.episodes(like_count desc);
create index idx_episodes_rating_avg on public.episodes(rating_avg desc);
create index idx_episodes_views_7d on public.episodes(views_7d desc);
create index idx_episodes_cdn_slug on public.episodes(cdn_slug);
