-- =====================================================================
-- 0011_rls_policies.sql
-- Enable RLS and define policies for every table.
-- Admin = JWT claim role='admin' via public.is_admin().
-- =====================================================================

alter table public.profiles               enable row level security;
alter table public.agency_offices         enable row level security;
alter table public.listings               enable row level security;
alter table public.listing_photos         enable row level security;
alter table public.listing_videos         enable row level security;
alter table public.projects               enable row level security;
alter table public.lot_type_groups        enable row level security;
alter table public.individual_lots        enable row level security;
alter table public.project_tranches       enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.availability_slots     enable row level security;
alter table public.appointments           enable row level security;
alter table public.leads                  enable row level security;
alter table public.agency_clients         enable row level security;
alter table public.client_search_profiles enable row level security;
alter table public.reviews                enable row level security;
alter table public.tenants                enable row level security;
alter table public.tenant_payments        enable row level security;
alter table public.agreements             enable row level security;
alter table public.notifications          enable row level security;
alter table public.saved_searches         enable row level security;
alter table public.listing_waitlists      enable row level security;
alter table public.social_posts           enable row level security;
alter table public.exclusivity_conflicts  enable row level security;
alter table public.admin_actions          enable row level security;

-- ----- PROFILES ------------------------------------------------------
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin());

create or replace view public.profiles_public as
select id, account_type, first_name, last_name, agency_name,
       avatar_url, bio, founded_year, verification_status, created_at
from public.profiles;
grant select on public.profiles_public to anon, authenticated;

-- ----- AGENCY OFFICES ------------------------------------------------
drop policy if exists offices_public_select on public.agency_offices;
create policy offices_public_select on public.agency_offices
  for select using (true);

drop policy if exists offices_owner_write on public.agency_offices;
create policy offices_owner_write on public.agency_offices
  for all using (agency_id = auth.uid() or public.is_admin())
  with check (agency_id = auth.uid() or public.is_admin());

-- ----- LISTINGS ------------------------------------------------------
drop policy if exists listings_public_select on public.listings;
create policy listings_public_select on public.listings
  for select using (
    status = 'active' or owner_id = auth.uid() or public.is_admin()
  );

drop policy if exists listings_owner_insert on public.listings;
create policy listings_owner_insert on public.listings
  for insert with check (owner_id = auth.uid() and status = 'pending');

drop policy if exists listings_owner_update on public.listings;
create policy listings_owner_update on public.listings
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists listings_owner_delete on public.listings;
create policy listings_owner_delete on public.listings
  for delete using (owner_id = auth.uid() or public.is_admin());

-- ----- LISTING PHOTOS / VIDEOS --------------------------------------
drop policy if exists listing_photos_select on public.listing_photos;
create policy listing_photos_select on public.listing_photos
  for select using (
    exists (select 1 from public.listings l
            where l.id = listing_photos.listing_id
              and (l.status = 'active' or l.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists listing_photos_owner_write on public.listing_photos;
create policy listing_photos_owner_write on public.listing_photos
  for all using (
    exists (select 1 from public.listings l
            where l.id = listing_photos.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.listings l
            where l.id = listing_photos.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists listing_videos_select on public.listing_videos;
create policy listing_videos_select on public.listing_videos
  for select using (
    exists (select 1 from public.listings l
            where l.id = listing_videos.listing_id
              and (l.status = 'active' or l.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists listing_videos_owner_write on public.listing_videos;
create policy listing_videos_owner_write on public.listing_videos
  for all using (
    exists (select 1 from public.listings l
            where l.id = listing_videos.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.listings l
            where l.id = listing_videos.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

-- ----- PROJECTS / LOTS ----------------------------------------------
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (status = 'active' or developer_id = auth.uid() or public.is_admin());

drop policy if exists projects_owner_write on public.projects;
create policy projects_owner_write on public.projects
  for all using (developer_id = auth.uid() or public.is_admin())
  with check (developer_id = auth.uid() or public.is_admin());

drop policy if exists lot_groups_select on public.lot_type_groups;
create policy lot_groups_select on public.lot_type_groups
  for select using (
    exists (select 1 from public.projects p
            where p.id = lot_type_groups.project_id
              and (p.status = 'active' or p.developer_id = auth.uid() or public.is_admin()))
  );

drop policy if exists lot_groups_write on public.lot_type_groups;
create policy lot_groups_write on public.lot_type_groups
  for all using (
    exists (select 1 from public.projects p
            where p.id = lot_type_groups.project_id and p.developer_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.projects p
            where p.id = lot_type_groups.project_id and p.developer_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists lots_select on public.individual_lots;
create policy lots_select on public.individual_lots
  for select using (
    exists (select 1 from public.lot_type_groups g
            join public.projects p on p.id = g.project_id
            where g.id = individual_lots.lot_type_group_id
              and (p.status = 'active' or p.developer_id = auth.uid() or public.is_admin()))
  );

drop policy if exists lots_write on public.individual_lots;
create policy lots_write on public.individual_lots
  for all using (
    exists (select 1 from public.lot_type_groups g
            join public.projects p on p.id = g.project_id
            where g.id = individual_lots.lot_type_group_id and p.developer_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.lot_type_groups g
            join public.projects p on p.id = g.project_id
            where g.id = individual_lots.lot_type_group_id and p.developer_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists tranches_select on public.project_tranches;
create policy tranches_select on public.project_tranches
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_tranches.project_id
              and (p.status = 'active' or p.developer_id = auth.uid() or public.is_admin()))
  );

drop policy if exists tranches_write on public.project_tranches;
create policy tranches_write on public.project_tranches
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_tranches.project_id and p.developer_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.projects p
            where p.id = project_tranches.project_id and p.developer_id = auth.uid())
    or public.is_admin()
  );

-- ----- CONVERSATIONS / MESSAGES --------------------------------------
drop policy if exists conversations_participant_select on public.conversations;
create policy conversations_participant_select on public.conversations
  for select using (
    seeker_id = auth.uid() or owner_id = auth.uid() or public.is_admin()
  );

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (seeker_id = auth.uid());

drop policy if exists conversations_participant_update on public.conversations;
create policy conversations_participant_update on public.conversations
  for update using (seeker_id = auth.uid() or owner_id = auth.uid())
  with check (seeker_id = auth.uid() or owner_id = auth.uid());

drop policy if exists messages_participant_select on public.messages;
create policy messages_participant_select on public.messages
  for select using (
    exists (select 1 from public.conversations c
            where c.id = messages.conversation_id
              and (c.seeker_id = auth.uid() or c.owner_id = auth.uid()))
    or public.is_admin()
  );

drop policy if exists messages_participant_insert on public.messages;
create policy messages_participant_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                where c.id = messages.conversation_id
                  and (c.seeker_id = auth.uid() or c.owner_id = auth.uid()))
  );

drop policy if exists messages_sender_update on public.messages;
create policy messages_sender_update on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- ----- AVAILABILITY / APPOINTMENTS -----------------------------------
drop policy if exists availability_select on public.availability_slots;
create policy availability_select on public.availability_slots
  for select using (true);

drop policy if exists availability_owner_write on public.availability_slots;
create policy availability_owner_write on public.availability_slots
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists appointments_participant_select on public.appointments;
create policy appointments_participant_select on public.appointments
  for select using (
    proposer_id = auth.uid() or recipient_id = auth.uid() or public.is_admin()
  );

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (proposer_id = auth.uid());

drop policy if exists appointments_participant_update on public.appointments;
create policy appointments_participant_update on public.appointments
  for update using (proposer_id = auth.uid() or recipient_id = auth.uid())
  with check (proposer_id = auth.uid() or recipient_id = auth.uid());

-- ----- LEADS / AGENCY CLIENTS / CLIENT SEARCH PROFILES ---------------
drop policy if exists leads_agency_all on public.leads;
create policy leads_agency_all on public.leads
  for all using (agency_id = auth.uid() or public.is_admin())
  with check (agency_id = auth.uid() or public.is_admin());

drop policy if exists clients_agency_all on public.agency_clients;
create policy clients_agency_all on public.agency_clients
  for all using (agency_id = auth.uid() or public.is_admin())
  with check (agency_id = auth.uid() or public.is_admin());

drop policy if exists client_profiles_agency_all on public.client_search_profiles;
create policy client_profiles_agency_all on public.client_search_profiles
  for all using (agency_id = auth.uid() or public.is_admin())
  with check (agency_id = auth.uid() or public.is_admin());

-- ----- NOTIFICATIONS -------------------------------------------------
drop policy if exists notifications_self_select on public.notifications;
create policy notifications_self_select on public.notifications
  for select using (user_email = auth.email() or public.is_admin());

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications
  for update using (user_email = auth.email())
  with check (user_email = auth.email());

-- (no INSERT policy → only service role inserts)

-- ----- SAVED SEARCHES ------------------------------------------------
drop policy if exists saved_searches_owner_all on public.saved_searches;
create policy saved_searches_owner_all on public.saved_searches
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ----- TENANTS / TENANT PAYMENTS / AGREEMENTS ------------------------
drop policy if exists tenants_landlord_all on public.tenants;
create policy tenants_landlord_all on public.tenants
  for all using (landlord_id = auth.uid() or public.is_admin())
  with check (landlord_id = auth.uid() or public.is_admin());

drop policy if exists tenant_payments_landlord_all on public.tenant_payments;
create policy tenant_payments_landlord_all on public.tenant_payments
  for all using (
    exists (select 1 from public.tenants t
            where t.id = tenant_payments.tenant_id and t.landlord_id = auth.uid())
    or public.is_admin()
  ) with check (
    exists (select 1 from public.tenants t
            where t.id = tenant_payments.tenant_id and t.landlord_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists agreements_party_select on public.agreements;
create policy agreements_party_select on public.agreements
  for select using (
    landlord_id = auth.uid() or tenant_id = auth.uid() or public.is_admin()
  );

drop policy if exists agreements_landlord_insert on public.agreements;
create policy agreements_landlord_insert on public.agreements
  for insert with check (landlord_id = auth.uid());

drop policy if exists agreements_party_update on public.agreements;
create policy agreements_party_update on public.agreements
  for update using (landlord_id = auth.uid() or tenant_id = auth.uid())
  with check (landlord_id = auth.uid() or tenant_id = auth.uid());

-- ----- REVIEWS -------------------------------------------------------
drop policy if exists reviews_public_select on public.reviews;
create policy reviews_public_select on public.reviews for select using (true);

drop policy if exists reviews_authenticated_insert on public.reviews;
create policy reviews_authenticated_insert on public.reviews
  for insert with check (reviewer_id = auth.uid());

drop policy if exists reviews_admin_update on public.reviews;
create policy reviews_admin_update on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews
  for delete using (public.is_admin());

-- ----- LISTING WAITLISTS ---------------------------------------------
drop policy if exists waitlist_select on public.listing_waitlists;
create policy waitlist_select on public.listing_waitlists
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.listings l
               where l.id = listing_waitlists.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists waitlist_insert on public.listing_waitlists;
create policy waitlist_insert on public.listing_waitlists
  for insert with check (user_id = auth.uid());

drop policy if exists waitlist_update on public.listing_waitlists;
create policy waitlist_update on public.listing_waitlists
  for update using (
    user_id = auth.uid()
    or exists (select 1 from public.listings l
               where l.id = listing_waitlists.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  ) with check (
    user_id = auth.uid()
    or exists (select 1 from public.listings l
               where l.id = listing_waitlists.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists waitlist_delete on public.listing_waitlists;
create policy waitlist_delete on public.listing_waitlists
  for delete using (user_id = auth.uid() or public.is_admin());

-- ----- SOCIAL POSTS --------------------------------------------------
drop policy if exists social_posts_owner_select on public.social_posts;
create policy social_posts_owner_select on public.social_posts
  for select using (
    exists (select 1 from public.listings l
            where l.id = social_posts.listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );
-- writes only via service role

-- ----- EXCLUSIVITY CONFLICTS / ADMIN ACTIONS -------------------------
drop policy if exists exclusivity_admin_all on public.exclusivity_conflicts;
create policy exclusivity_admin_all on public.exclusivity_conflicts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_actions_admin_all on public.admin_actions;
create policy admin_actions_admin_all on public.admin_actions
  for all using (public.is_admin()) with check (public.is_admin());

-- ----- STORAGE BUCKETS RLS -------------------------------------------
-- Folder convention: <owner_id>/<rest_of_path>
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (
    bucket_id in ('listing-photos','listing-videos','profile-avatars',
                  'watermarked-photos','watermarked-videos')
  );

drop policy if exists "owner upload media" on storage.objects;
create policy "owner upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('listing-photos','listing-videos','profile-avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner update media" on storage.objects;
create policy "owner update media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('listing-photos','listing-videos','profile-avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner delete media" on storage.objects;
create policy "owner delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('listing-photos','listing-videos','profile-avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );