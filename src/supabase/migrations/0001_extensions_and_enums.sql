-- =====================================================================
-- 0001_extensions_and_enums.sql
-- Enable required Postgres extensions and shared helper functions.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists postgis;
create extension if not exists pg_cron;
create extension if not exists http;

-- updated_at trigger function (reused by every table)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- is_admin() — used by RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'admin';
$$;