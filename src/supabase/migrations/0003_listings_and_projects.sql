-- =====================================================================
-- 0003_listings_and_projects.sql
-- Listings, listing media, projects, lot type groups, individual lots,
-- project tranches.
-- =====================================================================

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  listing_type text not null check (listing_type in ('sale','rent')),
  property_type text not null,
  wilaya text not null,
  commune text,
  address text,
  coordinates geography(Point, 4326),
  price bigint,
  price_display text,
  price_negotiable boolean not null default false,
  rental_period text,
  area_value numeric,
  area_unit text check (area_unit in ('m2','hectares')),
  normalized_area_m2 numeric,
  status text not null default 'pending'
    check (status in ('pending','active','reserved','sold','rented','deleted')),
  is_exclusive boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_whatsapp text,
  show_phone boolean not null default true,
  show_email boolean not null default false,
  watermark_status text check (watermark_status in ('pending','done','failed')),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  submitted_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  watermarked_url text,
  position int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_videos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  watermarked_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null,
  project_type text,
  listing_type text check (listing_type in ('sale','rent')),
  wilaya text,
  commune text,
  address text,
  coordinates geography(Point, 4326),
  description text,
  status text not null default 'pending'
    check (status in ('pending','active','sold_out','archived','deleted')),
  delivery_date date,
  total_units int,
  total_floors int,
  total_buildings int,
  parking_spots int,
  is_exclusive boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lot_type_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  lot_type text not null,
  total_count int,
  area_min numeric,
  area_max numeric,
  price_min bigint,
  price_max bigint,
  floor_min int,
  floor_max int,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.individual_lots (
  id uuid primary key default gen_random_uuid(),
  lot_type_group_id uuid not null references public.lot_type_groups(id) on delete cascade,
  lot_reference text,
  floor int,
  area numeric,
  price bigint,
  orientation text[],
  has_balcony boolean,
  has_terrace boolean,
  has_garden boolean,
  parking_included boolean,
  status text not null default 'available'
    check (status in ('available','reserved','sold')),
  additional_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tranches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tranche_name text,
  expected_delivery_date date,
  units_in_tranche jsonb not null default '{}'::jsonb,
  tranche_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);