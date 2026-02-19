-- Profiles table extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  avatar_url text,
  bio text default '',
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  is_premium boolean not null default false,
  blacklisted_genres uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for username lookups
create index idx_profiles_username on public.profiles(username);
create index idx_profiles_role on public.profiles(role);
