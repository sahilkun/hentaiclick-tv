-- Add a foreign key from playlists.user_id to public.profiles(id)
-- so PostgREST can resolve the join for user profile data
alter table public.playlists
  add constraint playlists_user_id_profiles_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
