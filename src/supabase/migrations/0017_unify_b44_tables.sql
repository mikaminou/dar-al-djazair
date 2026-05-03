-- =====================================================================
-- 0017_unify_b44_tables.sql
--
-- Goal: standardize entity tables on a single, unprefixed name.
-- Strategy:
--   1. Drop the legacy duplicates that the app no longer uses
--      (their b44_* counterpart is the live one).
--   2. Rename b44_* tables to their unprefixed names so backend
--      function code reads from a clean schema.
--
-- Project-related tables (b44_projects, b44_project_lots,
--   b44_project_lot_types, b44_upgrade_requests) are intentionally
--   left as-is because the unprefixed names already exist as rich
--   core tables (different shape). Reworking them is out of scope.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Drop legacy duplicates that the app no longer reads/writes.
--    The corresponding b44_* table holds the live data.
-- ---------------------------------------------------------------------
drop table if exists public.tenant_payments cascade;
drop table if exists public.tenants cascade;
drop table if exists public.reviews cascade;
drop table if exists public.saved_searches cascade;
drop table if exists public.listing_waitlists cascade;

-- ---------------------------------------------------------------------
-- 2. Rename b44_* tables → unprefixed names.
--    Indexes & constraints follow the table automatically.
-- ---------------------------------------------------------------------
alter table public.b44_appointments            rename to appointments;
alter table public.b44_availability_slots      rename to availability_slots;
alter table public.b44_clients                 rename to clients;
alter table public.b44_client_search_profiles  rename to client_search_profiles;
alter table public.b44_leads                   rename to leads;
alter table public.b44_messages                rename to messages;
alter table public.b44_reviews                 rename to reviews;
alter table public.b44_saved_searches          rename to saved_searches;
alter table public.b44_tenants                 rename to tenants;
alter table public.b44_tenant_payments         rename to tenant_payments;
alter table public.b44_waitlists               rename to waitlists;

-- ---------------------------------------------------------------------
-- 3. Project-related b44_* tables: kept prefixed.
--    `public.projects` already exists with a different (richer) schema
--    and is referenced by FKs (lot_type_groups, project_tranches, etc.).
--    Leaving b44_projects / b44_project_lots / b44_project_lot_types /
--    b44_upgrade_requests untouched.
-- ---------------------------------------------------------------------