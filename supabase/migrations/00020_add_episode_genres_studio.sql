-- Add studio_id directly on episodes (for standalone episodes or overrides)
alter table public.episodes
  add column studio_id uuid references public.studios(id) on delete set null;

create index idx_episodes_studio on public.episodes(studio_id);

-- Episode-Genres junction table (direct genre assignment per episode)
create table public.episode_genres (
  episode_id uuid not null references public.episodes(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (episode_id, genre_id)
);

create index idx_episode_genres_genre on public.episode_genres(genre_id);

-- RLS
alter table public.episode_genres enable row level security;

create policy "Episode genres are viewable by everyone"
  on public.episode_genres for select using (true);

create policy "Staff can manage episode genres"
  on public.episode_genres for all using (public.is_staff()) with check (public.is_staff());
