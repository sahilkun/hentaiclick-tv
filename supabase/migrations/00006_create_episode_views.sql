create table public.episode_views (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  viewed_at timestamptz not null default now()
);

create index idx_episode_views_episode on public.episode_views(episode_id);
create index idx_episode_views_user on public.episode_views(user_id);
create index idx_episode_views_viewed_at on public.episode_views(viewed_at desc);
create index idx_episode_views_dedup on public.episode_views(episode_id, ip_hash, viewed_at);
