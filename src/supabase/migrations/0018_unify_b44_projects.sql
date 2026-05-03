-- =====================================================================
-- 0018_unify_b44_projects.sql
--
-- Final consolidation of b44_* prefixed tables.
-- Same approach as 0017: drop unused legacy duplicates, rename
-- b44_* tables to their canonical unprefixed names.
--
-- The legacy `projects`, `lot_type_groups`, `individual_lots`,
-- `project_tranches` and `agreements` tables were created in 0003 with
-- a different shape than what the frontend code uses today.
-- The live data path is the jsonb-based b44_projects /
-- b44_project_lots / b44_project_lot_types tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Drop unused legacy tables (and FK-dependent ones first).
-- ---------------------------------------------------------------------
drop table if exists public.agreements           cascade;
drop table if exists public.individual_lots     cascade;
drop table if exists public.lot_type_groups     cascade;
drop table if exists public.project_tranches    cascade;
drop table if exists public.projects            cascade;

-- ---------------------------------------------------------------------
-- 2. Rename b44_* → unprefixed.
-- ---------------------------------------------------------------------
alter table public.b44_projects           rename to projects;
alter table public.b44_project_lots       rename to project_lots;
alter table public.b44_project_lot_types  rename to project_lot_types;
alter table public.b44_upgrade_requests   rename to upgrade_requests;