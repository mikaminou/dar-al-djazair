-- =====================================================================
-- 0013_listings_status_expand.sql
-- Expand the listings.status CHECK constraint to include all statuses
-- used by the Base44 frontend:
--   pending, active, reserved, sold, rented, archived,
--   deleted, declined, changes_requested, watermarking
-- =====================================================================

alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in (
    'pending', 'active', 'reserved', 'sold', 'rented',
    'archived', 'deleted', 'declined', 'changes_requested',
    'watermarking'
  ));