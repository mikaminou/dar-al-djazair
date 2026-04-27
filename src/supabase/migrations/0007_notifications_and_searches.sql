-- =====================================================================
-- 0007_notifications_and_searches.sql
-- =====================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  type text not null,
  title text,
  body text,
  url text,
  is_read boolean not null default false,
  ref_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  filters jsonb not null,
  notify_email boolean not null default true,
  notify_push  boolean not null default true,
  last_match_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_waitlists (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  position int,
  status text not null default 'waiting'
    check (status in ('waiting','contacted','withdrawn')),
  notes text,
  joined_at timestamptz not null default now(),
  unique (listing_id, user_id)
);