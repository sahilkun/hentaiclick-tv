create table public.comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comments_episode on public.comments(episode_id);
create index idx_comments_user on public.comments(user_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_comments_status on public.comments(status);
create index idx_comments_episode_approved on public.comments(episode_id) where status = 'approved';
