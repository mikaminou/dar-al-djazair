-- =====================================================================
-- 0019_drop_unused_tables.sql
--
-- Drop tables that exist in the database but are no longer referenced
-- by any application code:
--
--   • agency_clients   — replaced by `clients` (clientCrud)
--   • agency_offices   — offices are stored as a JSON array on
--                        profiles.<agency_offices> via base44.auth.updateMe
--   • conversations    — message threads are derived directly from the
--                        `messages` table; no separate conversations
--                        record is created or read by the app.
-- =====================================================================

drop table if exists public.agency_clients cascade;
drop table if exists public.agency_offices cascade;
drop table if exists public.conversations  cascade;