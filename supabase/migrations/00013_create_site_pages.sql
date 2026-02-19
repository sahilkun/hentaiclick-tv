create table public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null default '',
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_site_pages_slug on public.site_pages(slug);

-- Seed the premium page
insert into public.site_pages (slug, title, content) values (
  'premium',
  'How to Get Premium',
  '## How to Get Premium

Premium members get access to:
- **4K streaming** on all episodes from day one
- **Unlimited 4K downloads**
- **No captcha** on downloads

### How to upgrade

Join our Discord server and follow the instructions in the #premium channel.

[Join Discord](#)'
);
