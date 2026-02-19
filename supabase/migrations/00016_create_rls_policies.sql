-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.studios enable row level security;
alter table public.genres enable row level security;
alter table public.series enable row level security;
alter table public.series_genres enable row level security;
alter table public.episodes enable row level security;
alter table public.episode_views enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_episodes enable row level security;
alter table public.download_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_pages enable row level security;

-- ========== PROFILES ==========
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ========== STUDIOS ==========
create policy "Studios are viewable by everyone"
  on public.studios for select using (true);

create policy "Staff can manage studios"
  on public.studios for all using (public.is_staff()) with check (public.is_staff());

-- ========== GENRES ==========
create policy "Genres are viewable by everyone"
  on public.genres for select using (true);

create policy "Staff can manage genres"
  on public.genres for all using (public.is_staff()) with check (public.is_staff());

-- ========== SERIES ==========
create policy "Published series are viewable by everyone"
  on public.series for select using (true);

create policy "Staff can manage series"
  on public.series for all using (public.is_staff()) with check (public.is_staff());

-- ========== SERIES_GENRES ==========
create policy "Series genres are viewable by everyone"
  on public.series_genres for select using (true);

create policy "Staff can manage series genres"
  on public.series_genres for all using (public.is_staff()) with check (public.is_staff());

-- ========== EPISODES ==========
create policy "Published episodes are viewable by everyone"
  on public.episodes for select using (status = 'published' or public.is_staff());

create policy "Staff can manage episodes"
  on public.episodes for insert with check (public.is_staff());

create policy "Staff can update episodes"
  on public.episodes for update using (public.is_staff());

create policy "Staff can delete episodes"
  on public.episodes for delete using (public.is_staff());

-- ========== EPISODE VIEWS ==========
create policy "Anyone can insert views (via RPC)"
  on public.episode_views for insert with check (true);

create policy "Staff can view episode views"
  on public.episode_views for select using (public.is_staff());

-- ========== RATINGS ==========
create policy "Ratings are viewable by everyone"
  on public.ratings for select using (true);

create policy "Authenticated users can rate"
  on public.ratings for insert with check (auth.uid() = user_id);

create policy "Users can update own rating"
  on public.ratings for update using (auth.uid() = user_id);

create policy "Users can delete own rating"
  on public.ratings for delete using (auth.uid() = user_id);

-- ========== COMMENTS ==========
create policy "Approved comments are viewable by everyone"
  on public.comments for select using (
    status = 'approved'
    or auth.uid() = user_id
    or public.is_staff()
  );

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update own pending comments"
  on public.comments for update using (
    auth.uid() = user_id and status = 'pending'
  );

create policy "Staff can update any comment"
  on public.comments for update using (public.is_staff());

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

create policy "Staff can delete any comment"
  on public.comments for delete using (public.is_staff());

-- ========== FAVORITES ==========
create policy "Users can see own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- ========== PLAYLISTS ==========
create policy "Public playlists are viewable by everyone"
  on public.playlists for select using (is_public or auth.uid() = user_id);

create policy "Users can create playlists"
  on public.playlists for insert with check (auth.uid() = user_id);

create policy "Users can update own playlists"
  on public.playlists for update using (auth.uid() = user_id);

create policy "Users can delete own playlists"
  on public.playlists for delete using (auth.uid() = user_id);

-- ========== PLAYLIST EPISODES ==========
create policy "Playlist episodes are viewable if playlist is accessible"
  on public.playlist_episodes for select using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and (p.is_public or p.user_id = auth.uid())
    )
  );

create policy "Users can manage own playlist episodes"
  on public.playlist_episodes for insert with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create policy "Users can remove from own playlists"
  on public.playlist_episodes for delete using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

-- ========== DOWNLOAD LOGS ==========
create policy "Users can see own downloads"
  on public.download_logs for select using (
    auth.uid() = user_id or public.is_staff()
  );

create policy "Anyone can insert download logs"
  on public.download_logs for insert with check (true);

-- ========== AUDIT LOGS ==========
create policy "Only admins can view audit logs"
  on public.audit_logs for select using (public.is_admin());

create policy "Staff can insert audit logs"
  on public.audit_logs for insert with check (public.is_staff());

-- ========== SITE PAGES ==========
create policy "Site pages are viewable by everyone"
  on public.site_pages for select using (true);

create policy "Admins can manage site pages"
  on public.site_pages for all using (public.is_admin()) with check (public.is_admin());
