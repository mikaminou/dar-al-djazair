-- =====================================================================
-- 0009_indexes.sql
-- =====================================================================

-- LISTINGS
create index if not exists idx_listings_status_type
  on public.listings (status, listing_type, property_type);
create index if not exists idx_listings_price             on public.listings (price);
create index if not exists idx_listings_area              on public.listings (normalized_area_m2);
create index if not exists idx_listings_wilaya_commune    on public.listings (wilaya, commune);
create index if not exists idx_listings_owner             on public.listings (owner_id);
create index if not exists idx_listings_attributes_gin    on public.listings using gin (attributes);
create index if not exists idx_listings_coords_gist       on public.listings using gist (coordinates);

create index if not exists idx_listings_attr_bedrooms
  on public.listings ((( attributes ->> 'bedrooms' )::int));
create index if not exists idx_listings_attr_bathrooms
  on public.listings ((( attributes ->> 'bathrooms' )::int));
create index if not exists idx_listings_attr_floor
  on public.listings ((( attributes ->> 'floor' )::int));
create index if not exists idx_listings_attr_buildable
  on public.listings ((( attributes ->> 'buildable' )::boolean));

create index if not exists idx_listings_title_trgm
  on public.listings using gin (title gin_trgm_ops);

-- PROFILES
create index if not exists idx_profiles_account_type        on public.profiles (account_type);
create index if not exists idx_profiles_verification_status on public.profiles (verification_status);

-- AGENCY OFFICES
create index if not exists idx_agency_offices_agency on public.agency_offices (agency_id);
create index if not exists idx_agency_offices_coords on public.agency_offices using gist (coordinates);

-- CONVERSATIONS / MESSAGES
create index if not exists idx_conversations_seeker  on public.conversations (seeker_id);
create index if not exists idx_conversations_owner   on public.conversations (owner_id);
create index if not exists idx_conversations_listing on public.conversations (listing_id);
create index if not exists idx_messages_conversation
  on public.messages (conversation_id, created_at desc);

-- NOTIFICATIONS
create index if not exists idx_notifications_user_unread
  on public.notifications (user_email, is_read, created_at desc);
create index if not exists idx_notifications_ref_id on public.notifications (ref_id);

-- LEADS
create index if not exists idx_leads_agency_status on public.leads (agency_id, status);
create index if not exists idx_leads_score         on public.leads (score desc);

-- SAVED SEARCHES
create index if not exists idx_saved_searches_user    on public.saved_searches (user_id);
create index if not exists idx_saved_searches_filters on public.saved_searches using gin (filters);

-- PROJECTS
create index if not exists idx_projects_developer on public.projects (developer_id);
create index if not exists idx_projects_status    on public.projects (status);
create index if not exists idx_projects_coords    on public.projects using gist (coordinates);

-- WAITLISTS
create index if not exists idx_waitlists_listing on public.listing_waitlists (listing_id, position);
create index if not exists idx_waitlists_user    on public.listing_waitlists (user_id);

-- TENANTS
create index if not exists idx_tenants_landlord       on public.tenants (landlord_id);
create index if not exists idx_tenants_listing        on public.tenants (listing_id);
create index if not exists idx_tenant_payments_tenant on public.tenant_payments (tenant_id);

-- APPOINTMENTS
create index if not exists idx_appointments_proposer  on public.appointments (proposer_id);
create index if not exists idx_appointments_recipient on public.appointments (recipient_id);
create index if not exists idx_appointments_listing   on public.appointments (listing_id);

-- SOCIAL POSTS
create index if not exists idx_social_posts_listing on public.social_posts (listing_id);
create index if not exists idx_social_posts_archive on public.social_posts (scheduled_archive_at)
  where scheduled_archive_at is not null;