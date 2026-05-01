-- =====================================================================
-- 0014_flatten_listing_attributes.sql
-- Flatten the `attributes` JSONB blob on `listings` into real columns.
-- Every type-specific field across all 8 property types becomes its own
-- nullable column. Unused fields for a given property type are simply NULL.
--
-- Strategy:
--   1. Add all new columns (nullable).
--   2. Backfill from the existing attributes JSONB.
--   3. Drop the attributes column.
-- =====================================================================

-- ── 1. Add columns ──────────────────────────────────────────────────────

alter table public.listings
  -- system / cross-cutting fields previously in attributes
  add column if not exists admin_note text,
  add column if not exists active_since timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists views_count int not null default 0,
  add column if not exists agent_id text,
  add column if not exists owner_is_verified boolean not null default false,
  add column if not exists owner_verification_type text,
  add column if not exists exclusivity_conflict boolean not null default false,
  add column if not exists conflict_listing_id uuid,
  add column if not exists audit_log text[],
  add column if not exists hide_price boolean not null default false,
  add column if not exists hide_location boolean not null default true,
  add column if not exists price_period text,
  add column if not exists currency text default 'DZD',
  add column if not exists features text[],

  -- numeric type-specific fields
  add column if not exists land_area numeric,
  add column if not exists total_area numeric,
  add column if not exists buildable_area numeric,
  add column if not exists house_area numeric,
  add column if not exists rooms int,
  add column if not exists bedrooms int,
  add column if not exists bathrooms int,
  add column if not exists floor int,
  add column if not exists building_total_floors int,
  add column if not exists total_floors int,
  add column if not exists total_units int,
  add column if not exists levels int,
  add column if not exists garage_spots int,
  add column if not exists parking_spots int,
  add column if not exists frontage_meters numeric,
  add column if not exists frontage_count int,
  add column if not exists max_floors_allowed int,
  add column if not exists entrance_count int,
  add column if not exists ceiling_height numeric,
  add column if not exists workstation_capacity int,
  add column if not exists meeting_room_count int,
  add column if not exists proximity_to_road_meters numeric,
  add column if not exists monthly_revenue bigint,
  add column if not exists building_age int,
  add column if not exists year_built int,

  -- boolean amenities (apartment / house / villa / building / commercial / office / farm / land)
  add column if not exists is_top_floor boolean,
  add column if not exists water_tank boolean,
  add column if not exists balcony boolean,
  add column if not exists parking boolean,
  add column if not exists elevator boolean,
  add column if not exists fiber_internet boolean,
  add column if not exists terrace boolean,
  add column if not exists cave boolean,
  add column if not exists concierge boolean,
  add column if not exists security boolean,
  add column if not exists air_conditioning boolean,
  add column if not exists solar_panels boolean,
  add column if not exists well boolean,
  add column if not exists intercom boolean,
  add column if not exists double_glazing boolean,
  add column if not exists generator boolean,
  add column if not exists has_basement boolean,
  add column if not exists pool boolean,
  add column if not exists garden boolean,
  add column if not exists garage boolean,
  add column if not exists has_well boolean,
  add column if not exists boundary_walls boolean,
  add column if not exists has_summer_kitchen boolean,
  add column if not exists has_summer_living_room boolean,
  add column if not exists has_alarm boolean,
  add column if not exists has_servant_quarters boolean,
  add column if not exists is_gated_community boolean,
  add column if not exists buildable boolean,
  add column if not exists corner_plot boolean,
  add column if not exists has_water_access boolean,
  add column if not exists has_electricity boolean,
  add column if not exists has_road_access boolean,
  add column if not exists has_storefront boolean,
  add column if not exists commercial_license_included boolean,
  add column if not exists has_storage boolean,
  add column if not exists has_water_meter boolean,
  add column if not exists has_electricity_meter boolean,
  add column if not exists has_gas boolean,
  add column if not exists is_under_lease boolean,
  add column if not exists has_concierge_apartment boolean,
  add column if not exists has_elevator boolean,
  add column if not exists has_collective_heating boolean,
  add column if not exists has_reception_area boolean,
  add column if not exists is_accessible boolean,
  add column if not exists has_kitchen boolean,
  add column if not exists has_archive_room boolean,
  add column if not exists has_house boolean,
  add column if not exists has_fencing boolean,

  -- enum / text-valued fields
  add column if not exists furnished text,
  add column if not exists heating_type text,
  add column if not exists parking_type text,
  add column if not exists title_type text,
  add column if not exists slope text,
  add column if not exists zoning_type text,
  add column if not exists office_layout text,
  add column if not exists ground_floor_use text,
  add column if not exists current_activity text,
  add column if not exists water_source text,
  add column if not exists irrigation_type text,
  add column if not exists soil_type text,

  -- multi_enum array fields
  add column if not exists orientation text[],
  add column if not exists view_type text[],
  add column if not exists suitable_for text[],
  add column if not exists current_crops text[],
  add column if not exists equipment_included text[],
  add column if not exists livestock_included text[],

  -- structured (kept as jsonb because it's a free-form composition object)
  add column if not exists units_breakdown jsonb;

-- ── 2. Backfill from existing attributes JSONB ─────────────────────────

do $$
declare
  has_attr boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings' and column_name = 'attributes'
  ) into has_attr;

  if has_attr then
    -- Backfill all flat columns from the JSONB blob.
    -- Casts that fail will leave NULL — acceptable for a one-shot migration.
    update public.listings set
      admin_note               = coalesce(admin_note, attributes->>'admin_note'),
      active_since             = coalesce(active_since, nullif(attributes->>'active_since','')::timestamptz),
      is_featured              = coalesce(nullif(attributes->>'is_featured','')::boolean, is_featured),
      views_count              = coalesce(nullif(attributes->>'views_count','')::int, views_count),
      agent_id                 = coalesce(agent_id, attributes->>'agent_id'),
      owner_is_verified        = coalesce(nullif(attributes->>'owner_is_verified','')::boolean, owner_is_verified),
      owner_verification_type  = coalesce(owner_verification_type, attributes->>'owner_verification_type'),
      exclusivity_conflict     = coalesce(nullif(attributes->>'exclusivity_conflict','')::boolean, exclusivity_conflict),
      conflict_listing_id      = coalesce(conflict_listing_id, nullif(attributes->>'conflict_listing_id','')::uuid),
      hide_price               = coalesce(nullif(attributes->>'hide_price','')::boolean, hide_price),
      hide_location            = coalesce(nullif(attributes->>'hide_location','')::boolean, hide_location),
      price_period             = coalesce(price_period, attributes->>'price_period'),
      currency                 = coalesce(currency, attributes->>'currency'),

      land_area                = coalesce(land_area, nullif(attributes->>'land_area','')::numeric),
      total_area               = coalesce(total_area, nullif(attributes->>'total_area','')::numeric),
      buildable_area           = coalesce(buildable_area, nullif(attributes->>'buildable_area','')::numeric),
      house_area               = coalesce(house_area, nullif(attributes->>'house_area','')::numeric),
      rooms                    = coalesce(rooms, nullif(attributes->>'rooms','')::int),
      bedrooms                 = coalesce(bedrooms, nullif(attributes->>'bedrooms','')::int),
      bathrooms                = coalesce(bathrooms, nullif(attributes->>'bathrooms','')::int),
      floor                    = coalesce(floor, nullif(attributes->>'floor','')::int),
      building_total_floors    = coalesce(building_total_floors, nullif(attributes->>'building_total_floors','')::int),
      total_floors             = coalesce(total_floors, nullif(attributes->>'total_floors','')::int),
      total_units              = coalesce(total_units, nullif(attributes->>'total_units','')::int),
      levels                   = coalesce(levels, nullif(attributes->>'levels','')::int),
      garage_spots             = coalesce(garage_spots, nullif(attributes->>'garage_spots','')::int),
      parking_spots            = coalesce(parking_spots, nullif(attributes->>'parking_spots','')::int),
      frontage_meters          = coalesce(frontage_meters, nullif(attributes->>'frontage_meters','')::numeric),
      frontage_count           = coalesce(frontage_count, nullif(attributes->>'frontage_count','')::int),
      max_floors_allowed       = coalesce(max_floors_allowed, nullif(attributes->>'max_floors_allowed','')::int),
      entrance_count           = coalesce(entrance_count, nullif(attributes->>'entrance_count','')::int),
      ceiling_height           = coalesce(ceiling_height, nullif(attributes->>'ceiling_height','')::numeric),
      workstation_capacity     = coalesce(workstation_capacity, nullif(attributes->>'workstation_capacity','')::int),
      meeting_room_count       = coalesce(meeting_room_count, nullif(attributes->>'meeting_room_count','')::int),
      proximity_to_road_meters = coalesce(proximity_to_road_meters, nullif(attributes->>'proximity_to_road_meters','')::numeric),
      monthly_revenue          = coalesce(monthly_revenue, nullif(attributes->>'monthly_revenue','')::bigint),
      building_age             = coalesce(building_age, nullif(attributes->>'building_age','')::int),
      year_built               = coalesce(year_built, nullif(attributes->>'year_built','')::int),

      is_top_floor             = coalesce(is_top_floor, nullif(attributes->>'is_top_floor','')::boolean),
      water_tank               = coalesce(water_tank, nullif(attributes->>'water_tank','')::boolean),
      balcony                  = coalesce(balcony, nullif(attributes->>'balcony','')::boolean),
      parking                  = coalesce(parking, nullif(attributes->>'parking','')::boolean),
      elevator                 = coalesce(elevator, nullif(attributes->>'elevator','')::boolean),
      fiber_internet           = coalesce(fiber_internet, nullif(attributes->>'fiber_internet','')::boolean),
      terrace                  = coalesce(terrace, nullif(attributes->>'terrace','')::boolean),
      cave                     = coalesce(cave, nullif(attributes->>'cave','')::boolean),
      concierge                = coalesce(concierge, nullif(attributes->>'concierge','')::boolean),
      security                 = coalesce(security, nullif(attributes->>'security','')::boolean),
      air_conditioning         = coalesce(air_conditioning, nullif(attributes->>'air_conditioning','')::boolean),
      solar_panels             = coalesce(solar_panels, nullif(attributes->>'solar_panels','')::boolean),
      well                     = coalesce(well, nullif(attributes->>'well','')::boolean),
      intercom                 = coalesce(intercom, nullif(attributes->>'intercom','')::boolean),
      double_glazing           = coalesce(double_glazing, nullif(attributes->>'double_glazing','')::boolean),
      generator                = coalesce(generator, nullif(attributes->>'generator','')::boolean),
      has_basement             = coalesce(has_basement, nullif(attributes->>'has_basement','')::boolean),
      pool                     = coalesce(pool, nullif(attributes->>'pool','')::boolean),
      garden                   = coalesce(garden, nullif(attributes->>'garden','')::boolean),
      garage                   = coalesce(garage, nullif(attributes->>'garage','')::boolean),
      has_well                 = coalesce(has_well, nullif(attributes->>'has_well','')::boolean),
      boundary_walls           = coalesce(boundary_walls, nullif(attributes->>'boundary_walls','')::boolean),
      has_summer_kitchen       = coalesce(has_summer_kitchen, nullif(attributes->>'has_summer_kitchen','')::boolean),
      has_summer_living_room   = coalesce(has_summer_living_room, nullif(attributes->>'has_summer_living_room','')::boolean),
      has_alarm                = coalesce(has_alarm, nullif(attributes->>'has_alarm','')::boolean),
      has_servant_quarters     = coalesce(has_servant_quarters, nullif(attributes->>'has_servant_quarters','')::boolean),
      is_gated_community       = coalesce(is_gated_community, nullif(attributes->>'is_gated_community','')::boolean),
      buildable                = coalesce(buildable, nullif(attributes->>'buildable','')::boolean),
      corner_plot              = coalesce(corner_plot, nullif(attributes->>'corner_plot','')::boolean),
      has_water_access         = coalesce(has_water_access, nullif(attributes->>'has_water_access','')::boolean),
      has_electricity          = coalesce(has_electricity, nullif(attributes->>'has_electricity','')::boolean),
      has_road_access          = coalesce(has_road_access, nullif(attributes->>'has_road_access','')::boolean),
      has_storefront           = coalesce(has_storefront, nullif(attributes->>'has_storefront','')::boolean),
      commercial_license_included = coalesce(commercial_license_included, nullif(attributes->>'commercial_license_included','')::boolean),
      has_storage              = coalesce(has_storage, nullif(attributes->>'has_storage','')::boolean),
      has_water_meter          = coalesce(has_water_meter, nullif(attributes->>'has_water_meter','')::boolean),
      has_electricity_meter    = coalesce(has_electricity_meter, nullif(attributes->>'has_electricity_meter','')::boolean),
      has_gas                  = coalesce(has_gas, nullif(attributes->>'has_gas','')::boolean),
      is_under_lease           = coalesce(is_under_lease, nullif(attributes->>'is_under_lease','')::boolean),
      has_concierge_apartment  = coalesce(has_concierge_apartment, nullif(attributes->>'has_concierge_apartment','')::boolean),
      has_elevator             = coalesce(has_elevator, nullif(attributes->>'has_elevator','')::boolean),
      has_collective_heating   = coalesce(has_collective_heating, nullif(attributes->>'has_collective_heating','')::boolean),
      has_reception_area       = coalesce(has_reception_area, nullif(attributes->>'has_reception_area','')::boolean),
      is_accessible            = coalesce(is_accessible, nullif(attributes->>'is_accessible','')::boolean),
      has_kitchen              = coalesce(has_kitchen, nullif(attributes->>'has_kitchen','')::boolean),
      has_archive_room         = coalesce(has_archive_room, nullif(attributes->>'has_archive_room','')::boolean),
      has_house                = coalesce(has_house, nullif(attributes->>'has_house','')::boolean),
      has_fencing              = coalesce(has_fencing, nullif(attributes->>'has_fencing','')::boolean),

      furnished                = coalesce(furnished, attributes->>'furnished'),
      heating_type             = coalesce(heating_type, attributes->>'heating_type'),
      parking_type             = coalesce(parking_type, attributes->>'parking_type'),
      title_type               = coalesce(title_type, attributes->>'title_type'),
      slope                    = coalesce(slope, attributes->>'slope'),
      zoning_type              = coalesce(zoning_type, attributes->>'zoning_type'),
      office_layout            = coalesce(office_layout, attributes->>'office_layout'),
      ground_floor_use         = coalesce(ground_floor_use, attributes->>'ground_floor_use'),
      current_activity         = coalesce(current_activity, attributes->>'current_activity'),
      water_source             = coalesce(water_source, attributes->>'water_source'),
      irrigation_type          = coalesce(irrigation_type, attributes->>'irrigation_type'),
      soil_type                = coalesce(soil_type, attributes->>'soil_type'),

      orientation              = coalesce(orientation, case when jsonb_typeof(attributes->'orientation') = 'array' then array(select jsonb_array_elements_text(attributes->'orientation')) end),
      view_type                = coalesce(view_type, case when jsonb_typeof(attributes->'view_type') = 'array' then array(select jsonb_array_elements_text(attributes->'view_type')) end),
      suitable_for             = coalesce(suitable_for, case when jsonb_typeof(attributes->'suitable_for') = 'array' then array(select jsonb_array_elements_text(attributes->'suitable_for')) end),
      current_crops            = coalesce(current_crops, case when jsonb_typeof(attributes->'current_crops') = 'array' then array(select jsonb_array_elements_text(attributes->'current_crops')) end),
      equipment_included       = coalesce(equipment_included, case when jsonb_typeof(attributes->'equipment_included') = 'array' then array(select jsonb_array_elements_text(attributes->'equipment_included')) end),
      livestock_included       = coalesce(livestock_included, case when jsonb_typeof(attributes->'livestock_included') = 'array' then array(select jsonb_array_elements_text(attributes->'livestock_included')) end),
      audit_log                = coalesce(audit_log, case when jsonb_typeof(attributes->'audit_log') = 'array' then array(select jsonb_array_elements_text(attributes->'audit_log')) end),
      features                 = coalesce(features, case when jsonb_typeof(attributes->'features') = 'array' then array(select jsonb_array_elements_text(attributes->'features')) end),

      units_breakdown          = coalesce(units_breakdown, case when jsonb_typeof(attributes->'units_breakdown') in ('object','array') then attributes->'units_breakdown' end);
  end if;
exception when others then
  -- Best-effort migration; bad values stay NULL.
  raise notice 'flatten backfill warning: %', sqlerrm;
end$$;

-- ── 3. Drop the attributes blob ─────────────────────────────────────────

alter table public.listings drop column if exists attributes;

-- ── 4. Helpful indexes for common filters/sorts ─────────────────────────

create index if not exists idx_listings_property_type    on public.listings(property_type);
create index if not exists idx_listings_listing_type     on public.listings(listing_type);
create index if not exists idx_listings_status           on public.listings(status);
create index if not exists idx_listings_wilaya           on public.listings(wilaya);
create index if not exists idx_listings_bedrooms         on public.listings(bedrooms);
create index if not exists idx_listings_bathrooms        on public.listings(bathrooms);
create index if not exists idx_listings_price            on public.listings(price);
create index if not exists idx_listings_admin_note_active on public.listings(admin_note) where admin_note is not null;