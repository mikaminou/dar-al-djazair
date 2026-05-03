-- =====================================================================
-- 0019_agency_crm_alignment.sql
-- Align Agency CRM tables with proper relational model.
--
-- Changes:
--   1. Backfill agency_clients from public.clients (via agent_email -> profiles.id)
--   2. Drop public.clients
--   3. Add agency_id FK + alert fields to client_search_profiles
--   4. Backfill agency_id from agent_email
--   5. Drop legacy denormalized columns (agent_email, client_name)
--
-- Domain rules:
--   - saved_searches stays UNTOUCHED — it's the app-user pipeline
--   - client_search_profiles is agency-only, alerts go to the agency's email
--     mentioning the client (agency_clients.full_name)
-- =====================================================================

begin;

-- ── 1. Backfill agency_clients from clients ─────────────────────────────────
-- Insert any clients row whose agent_email matches a profile, that doesn't
-- already exist in agency_clients (matched on agency_id + full_name + phone).
insert into public.agency_clients (id, agency_id, full_name, phone, email, notes, created_at, updated_at)
select
  c.id,
  p.id as agency_id,
  c.full_name,
  c.phone,
  c.email,
  c.notes,
  c.created_at,
  c.updated_at
from public.clients c
join public.profiles p on lower(p.email) = lower(c.agent_email)
where not exists (
  select 1 from public.agency_clients ac
  where ac.agency_id = p.id
    and ac.full_name = c.full_name
    and coalesce(ac.phone, '') = coalesce(c.phone, '')
)
on conflict (id) do nothing;

-- ── 2. Migrate client_search_profiles to relational model ───────────────────
-- 2a. Add agency_id (nullable for now, backfill, then enforce NOT NULL)
alter table public.client_search_profiles
  add column if not exists agency_id uuid references public.profiles(id) on delete cascade;

alter table public.client_search_profiles
  add column if not exists alert_enabled boolean not null default false;

alter table public.client_search_profiles
  add column if not exists last_checked timestamptz;

-- 2b. Backfill agency_id from agent_email (where present and resolvable)
update public.client_search_profiles csp
set agency_id = p.id
from public.profiles p
where csp.agency_id is null
  and csp.agent_email is not null
  and lower(p.email) = lower(csp.agent_email);

-- 2c. Repoint client_id to surviving agency_clients rows where the original
-- client_id pointed at a row in public.clients that we just migrated.
-- (Same UUID is reused in step 1, so this is usually a no-op, but kept safe.)

-- 2d. Delete any orphan profiles we couldn't resolve (no matching agency)
delete from public.client_search_profiles where agency_id is null;

-- 2e. Enforce NOT NULL + add FK on client_id -> agency_clients
alter table public.client_search_profiles
  alter column agency_id set not null;

-- Add FK to agency_clients (skip if already valid; client_id was previously untyped FK)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'client_search_profiles'
      and constraint_name = 'client_search_profiles_client_id_fkey'
  ) then
    -- Drop orphan rows where client_id doesn't match agency_clients
    delete from public.client_search_profiles csp
    where not exists (select 1 from public.agency_clients ac where ac.id = csp.client_id);

    alter table public.client_search_profiles
      add constraint client_search_profiles_client_id_fkey
      foreign key (client_id) references public.agency_clients(id) on delete cascade;
  end if;
end$$;

-- 2f. Drop legacy denormalized columns
alter table public.client_search_profiles drop column if exists agent_email;
alter table public.client_search_profiles drop column if exists client_name;

-- 2g. Helpful indexes
create index if not exists idx_csp_agency on public.client_search_profiles(agency_id);
create index if not exists idx_csp_client on public.client_search_profiles(client_id);
create index if not exists idx_csp_alerts on public.client_search_profiles(alert_enabled) where alert_enabled = true;

-- ── 3. Drop legacy clients table ────────────────────────────────────────────
drop table if exists public.clients cascade;

-- ── 4. Helpful indexes on agency_clients ────────────────────────────────────
create index if not exists idx_agency_clients_agency on public.agency_clients(agency_id);

commit;