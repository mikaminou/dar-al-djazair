-- =====================================================================
-- 0020_csp_alerts_and_offices.sql
--
-- Two changes:
--   A. Add alert fields (alert_enabled, last_checked) to
--      client_search_profiles so the agency CRM can opt into email
--      alerts when new listings match a client's profile.
--   B. Recreate the agency_offices table (dropped in 0019) so offices
--      become a proper relational entity with an FK to profiles,
--      replacing the JSON blob that lived on the user record.
-- =====================================================================

-- ── A. client_search_profiles alert fields ──────────────────────────────────
alter table public.client_search_profiles
  add column if not exists alert_enabled boolean not null default false;

alter table public.client_search_profiles
  add column if not exists last_checked timestamptz;

create index if not exists idx_csp_alerts
  on public.client_search_profiles(alert_enabled)
  where alert_enabled = true;

-- ── B. agency_offices table (dropped in 0019, brought back relational) ──────
create table if not exists public.agency_offices (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles(id) on delete cascade,
  wilaya text not null,
  commune text,
  address text,
  phone text,
  email text,
  office_label text,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agency_offices_agency
  on public.agency_offices(agency_id);

-- updated_at trigger
drop trigger if exists trg_set_updated_at on public.agency_offices;
create trigger trg_set_updated_at
  before update on public.agency_offices
  for each row execute function public.set_updated_at();

-- Enforce single primary office per agency
create unique index if not exists uq_agency_offices_one_primary
  on public.agency_offices(agency_id)
  where is_primary = true;