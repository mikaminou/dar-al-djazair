-- =====================================================================
-- 0006_tenant_management.sql
-- =====================================================================

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete set null,
  full_name text,
  phone text,
  rent_amount bigint,
  period_type text not null
    check (period_type in ('monthly','trimestrial','biannual','yearly','custom')),
  period_count int not null default 1,
  start_date date not null,
  end_date date,
  special_conditions text,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount bigint not null,
  period_start date not null,
  period_end   date not null,
  payment_date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id   uuid references public.profiles(id) on delete set null,
  listing_id  uuid references public.listings(id) on delete set null,
  terms jsonb not null default '{}'::jsonb,
  status text not null default 'proposed'
    check (status in ('proposed','confirmed','disputed')),
  confirmed_at timestamptz,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);