create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create index idx_favorites_user on public.favorites(user_id);
create index idx_favorites_episode on public.favorites(episode_id);
