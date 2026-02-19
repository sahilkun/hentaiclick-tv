create table public.download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  quality integer not null,
  ip_hash text,
  turnstile_token text,
  created_at timestamptz not null default now()
);

create index idx_download_logs_user on public.download_logs(user_id);
create index idx_download_logs_episode on public.download_logs(episode_id);
create index idx_download_logs_user_date on public.download_logs(user_id, created_at)
  where quality = 2160;
