create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_subgenre boolean not null default false,
  parent_genre_id uuid references public.genres(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_genres_slug on public.genres(slug);
create index idx_genres_parent on public.genres(parent_genre_id);
