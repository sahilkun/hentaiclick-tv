-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', 'User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update rating_avg on rating change
create or replace function public.update_episode_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  v_episode_id uuid;
begin
  v_episode_id := coalesce(new.episode_id, old.episode_id);

  update public.episodes
  set
    rating_avg = coalesce(
      (select round(avg(score)::numeric, 1) from public.ratings where episode_id = v_episode_id),
      0
    ),
    rating_count = (select count(*) from public.ratings where episode_id = v_episode_id)
  where id = v_episode_id;

  return coalesce(new, old);
end;
$$;

create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute function public.update_episode_rating();

-- Update comment_count on comment status change
create or replace function public.update_episode_comment_count()
returns trigger
language plpgsql
security definer
as $$
declare
  v_episode_id uuid;
begin
  v_episode_id := coalesce(new.episode_id, old.episode_id);

  update public.episodes
  set comment_count = (
    select count(*) from public.comments
    where episode_id = v_episode_id and status = 'approved'
  )
  where id = v_episode_id;

  return coalesce(new, old);
end;
$$;

create trigger on_comment_change
  after insert or update or delete on public.comments
  for each row execute function public.update_episode_comment_count();

-- Update like_count on favorite toggle
create or replace function public.update_episode_like_count()
returns trigger
language plpgsql
security definer
as $$
declare
  v_episode_id uuid;
begin
  v_episode_id := coalesce(new.episode_id, old.episode_id);

  update public.episodes
  set like_count = (
    select count(*) from public.favorites where episode_id = v_episode_id
  )
  where id = v_episode_id;

  return coalesce(new, old);
end;
$$;

create trigger on_favorite_change
  after insert or delete on public.favorites
  for each row execute function public.update_episode_like_count();

-- Update playlist episode_count
create or replace function public.update_playlist_episode_count()
returns trigger
language plpgsql
security definer
as $$
declare
  v_playlist_id uuid;
begin
  v_playlist_id := coalesce(new.playlist_id, old.playlist_id);

  update public.playlists
  set episode_count = (
    select count(*) from public.playlist_episodes where playlist_id = v_playlist_id
  )
  where id = v_playlist_id;

  return coalesce(new, old);
end;
$$;

create trigger on_playlist_episode_change
  after insert or delete on public.playlist_episodes
  for each row execute function public.update_playlist_episode_count();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.studios
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.series
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.episodes
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.ratings
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.comments
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.playlists
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.site_pages
  for each row execute function public.update_updated_at();
