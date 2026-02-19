create table public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_studios_slug on public.studios(slug);
