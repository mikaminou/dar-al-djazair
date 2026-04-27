-- =====================================================================
-- 0005_crm_and_clients.sql
-- =====================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references public.profiles(id) on delete cascade,
  seeker_id  uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  status text not null default 'new'
    check (status in ('new','contacted','interested','won','lost')),
  score int not null default 0,
  financial_state text,
  assigned_to uuid references public.profiles(id) on delete set null,
  notes jsonb not null default '[]'::jsonb,
  activity_timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_search_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.agency_clients(id) on delete cascade,
  agency_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  filters jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings(id) on delete set null,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);