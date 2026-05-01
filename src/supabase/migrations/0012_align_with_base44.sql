-- =====================================================================
-- 0012_align_with_base44.sql
-- Align Supabase schema to match the Base44 entity shapes used by the
-- frontend. Adds missing tables and uses email-keyed, snake_case columns
-- exactly as the Base44 entities define them. This avoids translation
-- in backend functions.
--
-- Strategy: keep the existing tables from earlier migrations untouched
-- where possible, and add NEW tables (b44_*) only when the existing
-- table has a conflicting shape that would require translation.
-- For the simple/missing entities, we just create the table with the
-- exact Base44 field names.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Favorite (Base44: listing_id, user_email)
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  user_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_email)
);
create index if not exists idx_favorites_user_email on public.favorites(user_email);
create index if not exists idx_favorites_listing on public.favorites(listing_id);

-- ---------------------------------------------------------------------
-- Message (Base44: listing_id, sender_email, recipient_email, content,
--                  is_read, thread_id, hidden_for[])
-- The existing public.messages uses uuid sender_id + conversation_id —
-- we add a new table that matches Base44 exactly.
-- ---------------------------------------------------------------------
create table if not exists public.b44_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  sender_email text not null,
  recipient_email text not null,
  content text not null,
  is_read boolean not null default false,
  thread_id text,
  hidden_for text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_messages_thread on public.b44_messages(thread_id);
create index if not exists idx_b44_messages_recipient on public.b44_messages(recipient_email);
create index if not exists idx_b44_messages_sender on public.b44_messages(sender_email);

-- ---------------------------------------------------------------------
-- Lead (Base44: listing_id, listing_title, listing_wilaya, agent_email,
--               seeker_email, search_name, search_filters, status,
--               high_priority_alert_sent)
-- ---------------------------------------------------------------------
create table if not exists public.b44_leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  listing_title text,
  listing_wilaya text,
  agent_email text not null,
  seeker_email text not null,
  search_name text,
  search_filters jsonb not null default '{}'::jsonb,
  status text not null default 'new'
    check (status in ('new','contacted','viewing','won','lost','closed')),
  high_priority_alert_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_leads_agent on public.b44_leads(agent_email);
create index if not exists idx_b44_leads_seeker on public.b44_leads(seeker_email);

-- ---------------------------------------------------------------------
-- AvailabilitySlot (Base44: agent_email, listing_id, mode, date,
--   recur_day_of_week, date_range_start, date_range_end,
--   start_time, end_time, capacity, notes, is_active)
-- ---------------------------------------------------------------------
create table if not exists public.b44_availability_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id text,
  agent_email text not null,
  mode text not null default 'single'
    check (mode in ('single','recurring','date_range')),
  date date,
  recur_day_of_week int,
  date_range_start date,
  date_range_end date,
  start_time text not null,
  end_time text not null,
  capacity int,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_avail_agent on public.b44_availability_slots(agent_email);
create index if not exists idx_b44_avail_listing on public.b44_availability_slots(listing_id);

-- ---------------------------------------------------------------------
-- Appointment (Base44: slot_id, listing_id, listing_title, agent_email,
--   buyer_email, buyer_name, buyer_phone, date, start_time, end_time,
--   status, notes)
-- ---------------------------------------------------------------------
create table if not exists public.b44_appointments (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid,
  listing_id uuid,
  listing_title text,
  agent_email text not null,
  buyer_email text,
  buyer_name text not null,
  buyer_phone text,
  date text,
  start_time text,
  end_time text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_appt_agent on public.b44_appointments(agent_email);
create index if not exists idx_b44_appt_buyer on public.b44_appointments(buyer_email);

-- ---------------------------------------------------------------------
-- TypingStatus (Base44: thread_id, typer_email, typed_at)
-- ---------------------------------------------------------------------
create table if not exists public.typing_status (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  typer_email text not null,
  typed_at text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (thread_id, typer_email)
);

-- ---------------------------------------------------------------------
-- AppointmentProposal (Base44: thread_id, listing_id, listing_title,
--   proposer_email, other_email, proposer_name, proposed_date,
--   proposed_start_time, proposed_end_time, status, notes)
-- ---------------------------------------------------------------------
create table if not exists public.appointment_proposals (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  listing_id uuid,
  listing_title text,
  proposer_email text not null,
  other_email text not null,
  proposer_name text,
  proposed_date date not null,
  proposed_start_time text not null,
  proposed_end_time text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appt_prop_thread on public.appointment_proposals(thread_id);

-- ---------------------------------------------------------------------
-- VerificationRequest (Base44: user_email, user_name, type,
--   document_uri, agency_name, status, admin_note)
-- ---------------------------------------------------------------------
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text,
  type text not null check (type in ('professional','individual')),
  document_uri text not null,
  agency_name text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_verif_user on public.verification_requests(user_email);
create index if not exists idx_verif_status on public.verification_requests(status);

-- ---------------------------------------------------------------------
-- Review (Base44: reviewer_email, reviewer_name, reviewed_email,
--   lead_id, listing_id, listing_title, rating, comment)
-- ---------------------------------------------------------------------
create table if not exists public.b44_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_email text not null,
  reviewer_name text,
  reviewed_email text not null,
  lead_id uuid,
  listing_id uuid,
  listing_title text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_reviews_reviewed on public.b44_reviews(reviewed_email);

-- ---------------------------------------------------------------------
-- Tenant (Base44: listing_id, property_address, tenant_name,
--   tenant_phone, rent_amount, period_type, period_months,
--   total_paid_upfront, period_start_date, period_end_date,
--   special_conditions, status, landlord_email)
-- ---------------------------------------------------------------------
create table if not exists public.b44_tenants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  property_address text,
  tenant_name text not null,
  tenant_phone text,
  rent_amount numeric not null,
  period_type text not null
    check (period_type in ('monthly','trimestrial','6months','yearly','custom')),
  period_months int,
  total_paid_upfront numeric,
  period_start_date date not null,
  period_end_date date,
  special_conditions text,
  status text not null default 'active' check (status in ('active','ended')),
  landlord_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_tenants_landlord on public.b44_tenants(landlord_email);

-- ---------------------------------------------------------------------
-- TenantPayment (Base44: tenant_id, amount, payment_date,
--   period_start_date, period_end_date, reference_number,
--   landlord_email)
-- ---------------------------------------------------------------------
create table if not exists public.b44_tenant_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  amount numeric not null,
  payment_date date not null,
  period_start_date date not null,
  period_end_date date not null,
  reference_number text,
  landlord_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_payments_tenant on public.b44_tenant_payments(tenant_id);
create index if not exists idx_b44_payments_landlord on public.b44_tenant_payments(landlord_email);

-- ---------------------------------------------------------------------
-- PushSubscription (Base44: user_email, endpoint, keys_p256dh,
--   keys_auth, is_active)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);
create index if not exists idx_push_user on public.push_subscriptions(user_email);

-- ---------------------------------------------------------------------
-- NotificationPreference (Base44: user_email, push_enabled, sound_enabled)
-- ---------------------------------------------------------------------
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  push_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- UserPresence (Base44: user_email, last_seen)
-- ---------------------------------------------------------------------
create table if not exists public.user_presence (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  last_seen timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Waitlist (Base44: listing_id, listing_title, listing_wilaya,
--   owner_email, user_email, user_name, position, joined_at,
--   status, notes)
-- ---------------------------------------------------------------------
create table if not exists public.b44_waitlists (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  listing_title text,
  listing_wilaya text,
  owner_email text,
  user_email text not null,
  user_name text,
  position int,
  joined_at timestamptz not null default now(),
  status text not null default 'waiting'
    check (status in ('waiting','contacted','withdrawn')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_email)
);
create index if not exists idx_b44_waitlist_user on public.b44_waitlists(user_email);
create index if not exists idx_b44_waitlist_owner on public.b44_waitlists(owner_email);

-- ---------------------------------------------------------------------
-- Client (Base44: full_name, phone, email, notes, agent_email)
-- ---------------------------------------------------------------------
create table if not exists public.b44_clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  agent_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_clients_agent on public.b44_clients(agent_email);

-- ---------------------------------------------------------------------
-- ClientSearchProfile (Base44: client_id, client_name, agent_email,
--   name, filters)
-- ---------------------------------------------------------------------
create table if not exists public.b44_client_search_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  client_name text,
  agent_email text not null,
  name text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_csp_agent on public.b44_client_search_profiles(agent_email);
create index if not exists idx_b44_csp_client on public.b44_client_search_profiles(client_id);

-- ---------------------------------------------------------------------
-- SavedSearch (Base44: name, user_email, filters, financial_state,
--   alert_enabled, last_checked)
-- ---------------------------------------------------------------------
create table if not exists public.b44_saved_searches (
  id uuid primary key default gen_random_uuid(),
  name text,
  user_email text not null,
  filters jsonb not null default '{}'::jsonb,
  financial_state text
    check (financial_state is null or financial_state in ('cash','pre_approved','arranging','unspecified')),
  alert_enabled boolean not null default false,
  last_checked timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_saved_user on public.b44_saved_searches(user_email);

-- ---------------------------------------------------------------------
-- Notifications: existing public.notifications already matches Base44
-- (user_email, type, title, body, url, is_read, ref_id) — nothing to do.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Project entities — Base44 uses Project, ProjectLot, ProjectLotType,
-- UpgradeRequest. We don't have their full schemas in context here,
-- so we create generic tables with a jsonb `data` blob plus the
-- common fields. Backend functions will fully serialize/deserialize.
-- These will be tightened in a later migration once the schemas are
-- read from entities/Project*.json.
-- ---------------------------------------------------------------------
create table if not exists public.b44_projects (
  id uuid primary key default gen_random_uuid(),
  created_by text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b44_project_lots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  created_by text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_project_lots_project on public.b44_project_lots(project_id);

create table if not exists public.b44_project_lot_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  created_by text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_plt_project on public.b44_project_lot_types(project_id);

create table if not exists public.b44_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_b44_upgrade_user on public.b44_upgrade_requests(user_email);

-- ---------------------------------------------------------------------
-- updated_at trigger application — relies on set_updated_at()
-- defined in 0010_triggers.sql.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'favorites','b44_messages','b44_leads','b44_availability_slots',
    'b44_appointments','typing_status','appointment_proposals',
    'verification_requests','b44_reviews','b44_tenants',
    'b44_tenant_payments','push_subscriptions','notification_preferences',
    'user_presence','b44_waitlists','b44_clients',
    'b44_client_search_profiles','b44_saved_searches',
    'b44_projects','b44_project_lots','b44_project_lot_types',
    'b44_upgrade_requests'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;