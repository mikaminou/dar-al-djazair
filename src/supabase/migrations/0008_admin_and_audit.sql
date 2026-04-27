-- =====================================================================
-- 0008_admin_and_audit.sql
-- =====================================================================

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  agency_id  uuid references public.profiles(id) on delete set null,
  platform text not null check (platform in ('facebook','instagram','tiktok')),
  status text not null default 'pending'
    check (status in ('pending','success','failed','commented','archived','deleted')),
  post_url text,
  error_message text,
  posted_at timestamptz,
  facebook_post_id text,
  instagram_media_id text,
  scheduled_archive_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exclusivity_conflicts (
  id uuid primary key default gen_random_uuid(),
  original_listing_id uuid references public.listings(id) on delete set null,
  new_listing_id      uuid references public.listings(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','resolved_approved','resolved_declined')),
  admin_notes text,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  before jsonb,
  after  jsonb,
  reason text,
  created_at timestamptz not null default now()
);