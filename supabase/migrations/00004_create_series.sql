create table public.series (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid references public.studios(id) on delete set null,
  title text not null,
  slug text unique not null,
  description text default '',
  cover_url text,
  status text not null default 'ongoing' check (status in ('ongoing', 'completed', 'upcoming')),
  year integer,
  -- SEO
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_series_slug on public.series(slug);
create index idx_series_studio on public.series(studio_id);
create index idx_series_status on public.series(status);

-- Series-Genres junction
create table public.series_genres (
  series_id uuid not null references public.series(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (series_id, genre_id)
);

create index idx_series_genres_genre on public.series_genres(genre_id);
