-- =====================================================================
-- 0010_triggers.sql
-- =====================================================================

-- updated_at on every table that has it
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%1$I;
       create trigger trg_set_updated_at
       before update on public.%1$I
       for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;

-- listings.normalized_area_m2
create or replace function public.compute_normalized_area_m2()
returns trigger language plpgsql as $$
begin
  if new.area_value is null then
    new.normalized_area_m2 := null;
  elsif new.area_unit = 'hectares' then
    new.normalized_area_m2 := new.area_value * 10000;
  else
    new.normalized_area_m2 := new.area_value;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listings_normalize_area on public.listings;
create trigger trg_listings_normalize_area
before insert or update of area_value, area_unit on public.listings
for each row execute function public.compute_normalized_area_m2();

-- Auto-create profile on auth signup
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, language_preference)
  values (new.id, new.email, 'fr')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- tenants.end_date
create or replace function public.compute_tenant_end_date()
returns trigger language plpgsql as $$
declare months_per_period int;
begin
  months_per_period := case new.period_type
    when 'monthly'     then 1
    when 'trimestrial' then 3
    when 'biannual'    then 6
    when 'yearly'      then 12
    when 'custom'      then coalesce(new.period_count, 1)
  end;

  if new.period_type = 'custom' then
    new.end_date := new.start_date + (months_per_period || ' months')::interval;
  else
    new.end_date := new.start_date
      + (months_per_period * coalesce(new.period_count, 1) || ' months')::interval;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tenants_compute_end_date on public.tenants;
create trigger trg_tenants_compute_end_date
before insert or update of start_date, period_type, period_count on public.tenants
for each row execute function public.compute_tenant_end_date();

-- listing_waitlists.position
create or replace function public.assign_waitlist_position()
returns trigger language plpgsql as $$
begin
  if new.position is null then
    select coalesce(max(position), 0) + 1
      into new.position
      from public.listing_waitlists
     where listing_id = new.listing_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_waitlist_assign_position on public.listing_waitlists;
create trigger trg_waitlist_assign_position
before insert on public.listing_waitlists
for each row execute function public.assign_waitlist_position();

-- on_listing_approved: pending → active
-- Requires DB GUC vars app.settings.functions_url and
-- app.settings.service_role_key (see docs/LOCAL_DEVELOPMENT.md).
create or replace function public.on_listing_approved()
returns trigger language plpgsql security definer as $$
declare
  fn_base text := current_setting('app.settings.functions_url', true);
  service_key text := current_setting('app.settings.service_role_key', true);
  owner_email text;
begin
  if old.status = 'pending' and new.status = 'active' then
    select email into owner_email from public.profiles where id = new.owner_id;
    if owner_email is not null then
      insert into public.notifications (user_email, type, title, body, url, ref_id)
      values (owner_email, 'listing_approved', 'Your listing was approved',
              new.title, '/ListingDetail?id=' || new.id::text,
              'listing_approved_' || new.id::text)
      on conflict (ref_id) do nothing;
    end if;

    if fn_base is not null and fn_base <> '' then
      perform extensions.http_post(
        fn_base || '/watermark-listing-media',
        json_build_object('listing_id', new.id)::text,
        'application/json',
        array[
          extensions.http_header('Authorization', 'Bearer ' || coalesce(service_key, '')),
          extensions.http_header('Content-Type', 'application/json')
        ]
      );

      perform extensions.http_post(
        fn_base || '/social-media-post',
        json_build_object('listing_id', new.id)::text,
        'application/json',
        array[
          extensions.http_header('Authorization', 'Bearer ' || coalesce(service_key, '')),
          extensions.http_header('Content-Type', 'application/json')
        ]
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listing_approved on public.listings;
create trigger trg_listing_approved
after update of status on public.listings
for each row execute function public.on_listing_approved();

-- on_listing_status_change: notify waitlist + open conversations
create or replace function public.on_listing_status_change()
returns trigger language plpgsql security definer as $$
declare r record;
begin
  if new.status in ('reserved','sold','rented')
     and old.status is distinct from new.status then

    for r in
      select p.email from public.listing_waitlists w
      join public.profiles p on p.id = w.user_id
      where w.listing_id = new.id and w.status = 'waiting'
    loop
      insert into public.notifications (user_email, type, title, body, url, ref_id)
      values (r.email, 'listing_status_change',
              'A listing you follow changed status',
              new.title || ' is now ' || new.status,
              '/ListingDetail?id=' || new.id::text,
              'listing_status_' || new.id::text || '_' || new.status)
      on conflict (ref_id) do nothing;
    end loop;

    for r in
      select p.email from public.conversations c
      join public.profiles p on p.id = c.seeker_id
      where c.listing_id = new.id and c.status = 'open'
    loop
      insert into public.notifications (user_email, type, title, body, url, ref_id)
      values (r.email, 'listing_status_change',
              'Update on a listing you contacted',
              new.title || ' is now ' || new.status,
              '/ListingDetail?id=' || new.id::text,
              'listing_status_conv_' || new.id::text || '_' || new.status || '_' || r.email)
      on conflict (ref_id) do nothing;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listing_status_change on public.listings;
create trigger trg_listing_status_change
after update of status on public.listings
for each row execute function public.on_listing_status_change();