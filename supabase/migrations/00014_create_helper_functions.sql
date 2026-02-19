-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: check if current user is staff (admin or moderator)
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- RPC: record an episode view with 30-min dedup
create or replace function public.record_episode_view(
  p_episode_id uuid,
  p_ip_hash text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Check 30-minute dedup
  if exists (
    select 1 from public.episode_views
    where episode_id = p_episode_id
      and (
        (v_user_id is not null and user_id = v_user_id)
        or (v_user_id is null and ip_hash = p_ip_hash)
      )
      and viewed_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  -- Insert view
  insert into public.episode_views (episode_id, user_id, ip_hash)
  values (p_episode_id, v_user_id, p_ip_hash);

  -- Increment counter
  update public.episodes
  set view_count = view_count + 1
  where id = p_episode_id;
end;
$$;

-- RPC: get how many 4K downloads user has today
create or replace function public.get_user_4k_downloads_today()
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from public.download_logs
  where user_id = auth.uid()
    and quality = 2160
    and created_at >= date_trunc('day', now());
$$;

-- Function to recalculate views_7d (called by cron)
create or replace function public.recalculate_views_7d()
returns void
language sql
security definer
as $$
  update public.episodes e
  set views_7d = (
    select count(*)
    from public.episode_views v
    where v.episode_id = e.id
      and v.viewed_at > now() - interval '7 days'
  );
$$;
