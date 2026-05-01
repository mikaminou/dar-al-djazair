-- =====================================================================
-- 0002_profiles_and_auth.sql
-- Profiles (1:1 with auth.users) and agency offices.
-- =====================================================================

-- Path 1 architecture: Base44 owns auth. profiles.id is a self-generated UUID,
-- NOT linked to auth.users. Email is the bridge between Base44 sessions and DB rows.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  account_type text not null default 'individual'
    check (account_type in ('individual','agency','promoteur','admin')),
  first_name text,
  last_name text,
  agency_name text,
  phone text,
  avatar_url text,
  bio text,
  founded_year int,
  verification_status text
    check (verification_status is null or verification_status in ('pending','verified')),
  language_preference text not null default 'fr'
    check (language_preference in ('fr','ar','en')),
  notification_preferences jsonb not null default '{}'::jsonb,
  push_subscription jsonb,
  social_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_offices (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles(id) on delete cascade,
  wilaya text not null,
  commune text,
  address text,
  phone text,
  email text,
  coordinates geography(Point, 4326),
  office_label text,
  is_primary boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);