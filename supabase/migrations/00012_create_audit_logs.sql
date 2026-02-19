create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_admin on public.audit_logs(admin_user_id);
create index idx_audit_logs_target on public.audit_logs(target_type, target_id);
create index idx_audit_logs_created on public.audit_logs(created_at desc);
