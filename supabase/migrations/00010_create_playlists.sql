create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  is_public boolean not null default false,
  episode_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index idx_playlists_user on public.playlists(user_id);
create index idx_playlists_public on public.playlists(is_public) where is_public = true;

create table public.playlist_episodes (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (playlist_id, episode_id)
);

create index idx_playlist_episodes_playlist on public.playlist_episodes(playlist_id);
create index idx_playlist_episodes_position on public.playlist_episodes(playlist_id, position);
