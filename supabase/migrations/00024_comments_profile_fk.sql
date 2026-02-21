-- Add a foreign key from comments.user_id to public.profiles(id)
-- so PostgREST can resolve the join for user profile data
alter table public.comments
  add constraint comments_user_id_profiles_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
