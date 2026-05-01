-- =====================================================================
-- 0015_property_type_tables.sql
--
-- Create one dedicated table per property type holding only the columns
-- relevant to that type. Each row is keyed 1:1 by `listing_id` referencing
-- `public.listings(id)`. Shared fields (title, price, wilaya, status,
-- coordinates, area_value/unit, listing_type, owner_id, …) STAY on
-- `public.listings` — these per-type tables only carry type-specific
-- attributes so we can:
--   • filter / sort / index efficiently per property type
--   • avoid mixing irrelevant nullable columns
--   • keep schema discoverable (one table = one entity)
--
-- Tables created (1:1 with listings via listing_id PK):
--   listing_apartments
--   listing_houses
--   listing_villas
--   listing_lands
--   listing_commercials
--   listing_buildings
--   listing_offices
--   listing_farms
--
-- Strategy:
--   1. Create the 8 tables (PK = listing_id, FK ON DELETE CASCADE).
--   2. Backfill each from the existing flat columns on `listings`,
--      filtered by `property_type`.
--   3. Add per-table indexes on the most filterable fields.
--
-- NOTE: The flat columns on `listings` are intentionally KEPT (not dropped).
-- They remain as a fallback during the read-path migration and can be
-- dropped in a later migration once all reads/writes go through the
-- per-type tables.
-- =====================================================================

-- =====================================================================
-- 1. APARTMENT
-- =====================================================================
create table if not exists public.listing_apartments (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,
  -- characteristics
  rooms int,
  bedrooms int,
  bathrooms int,
  floor int,
  building_total_floors int,
  is_top_floor boolean,
  orientation text[],
  view_type text[],
  furnished text,
  -- amenities
  heating_type text,
  water_tank boolean,
  balcony boolean,
  parking boolean,
  parking_type text,
  elevator boolean,
  fiber_internet boolean,
  terrace boolean,
  cave boolean,
  concierge boolean,
  security boolean,
  air_conditioning boolean,
  solar_panels boolean,
  well boolean,
  intercom boolean,
  double_glazing boolean,
  generator boolean,
  -- construction
  building_age int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_apartments_bedrooms   on public.listing_apartments(bedrooms);
create index if not exists idx_listing_apartments_bathrooms  on public.listing_apartments(bathrooms);
create index if not exists idx_listing_apartments_area       on public.listing_apartments(area);
create index if not exists idx_listing_apartments_floor      on public.listing_apartments(floor);
create index if not exists idx_listing_apartments_furnished  on public.listing_apartments(furnished);

-- =====================================================================
-- 2. HOUSE
-- =====================================================================
create table if not exists public.listing_houses (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,
  land_area numeric,
  -- characteristics
  rooms int,
  bedrooms int,
  bathrooms int,
  levels int,
  orientation text[],
  view_type text[],
  furnished text,
  has_basement boolean,
  -- amenities
  pool boolean,
  heating_type text,
  water_tank boolean,
  garden boolean,
  garage boolean,
  parking_type text,
  has_well boolean,
  boundary_walls boolean,
  has_summer_kitchen boolean,
  terrace boolean,
  fiber_internet boolean,
  security boolean,
  air_conditioning boolean,
  solar_panels boolean,
  well boolean,
  intercom boolean,
  double_glazing boolean,
  generator boolean,
  -- construction
  year_built int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_houses_bedrooms   on public.listing_houses(bedrooms);
create index if not exists idx_listing_houses_bathrooms  on public.listing_houses(bathrooms);
create index if not exists idx_listing_houses_area       on public.listing_houses(area);
create index if not exists idx_listing_houses_land_area  on public.listing_houses(land_area);
create index if not exists idx_listing_houses_pool       on public.listing_houses(pool) where pool = true;
create index if not exists idx_listing_houses_garden     on public.listing_houses(garden) where garden = true;

-- =====================================================================
-- 3. VILLA
-- =====================================================================
create table if not exists public.listing_villas (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,
  land_area numeric,
  -- characteristics
  rooms int,
  bedrooms int,
  bathrooms int,
  levels int,
  has_servant_quarters boolean,
  is_gated_community boolean,
  view_type text[],
  furnished text,
  has_basement boolean,
  -- amenities
  heating_type text,
  water_tank boolean,
  garden boolean,
  pool boolean,
  has_summer_kitchen boolean,
  has_summer_living_room boolean,
  has_well boolean,
  boundary_walls boolean,
  has_alarm boolean,
  garage_spots int,
  terrace boolean,
  fiber_internet boolean,
  security boolean,
  air_conditioning boolean,
  solar_panels boolean,
  well boolean,
  intercom boolean,
  double_glazing boolean,
  generator boolean,
  -- construction
  year_built int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_villas_bedrooms       on public.listing_villas(bedrooms);
create index if not exists idx_listing_villas_bathrooms      on public.listing_villas(bathrooms);
create index if not exists idx_listing_villas_area           on public.listing_villas(area);
create index if not exists idx_listing_villas_land_area      on public.listing_villas(land_area);
create index if not exists idx_listing_villas_pool           on public.listing_villas(pool) where pool = true;
create index if not exists idx_listing_villas_gated          on public.listing_villas(is_gated_community) where is_gated_community = true;

-- =====================================================================
-- 4. LAND
-- =====================================================================
create table if not exists public.listing_lands (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,                 -- value (m² or hectares; unit lives on listings.area_unit)
  -- characteristics
  buildable boolean,
  title_type text,
  corner_plot boolean,
  slope text,
  frontage_count int,
  max_floors_allowed int,
  zoning_type text,
  frontage_meters numeric,
  -- access & utilities
  has_water_access boolean,
  has_electricity boolean,
  has_road_access boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_lands_area      on public.listing_lands(area);
create index if not exists idx_listing_lands_buildable on public.listing_lands(buildable);
create index if not exists idx_listing_lands_zoning    on public.listing_lands(zoning_type);

-- =====================================================================
-- 5. COMMERCIAL
-- =====================================================================
create table if not exists public.listing_commercials (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,
  -- characteristics
  floor int,
  frontage_meters numeric,
  has_storefront boolean,
  commercial_license_included boolean,
  current_activity text,
  entrance_count int,
  ceiling_height numeric,
  -- amenities
  has_storage boolean,
  parking boolean,
  has_water_meter boolean,
  has_electricity_meter boolean,
  has_gas boolean,
  security boolean,
  air_conditioning boolean,
  -- suitability
  suitable_for text[],
  -- construction
  year_built int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_commercials_area      on public.listing_commercials(area);
create index if not exists idx_listing_commercials_frontage  on public.listing_commercials(frontage_meters);
create index if not exists idx_listing_commercials_suitable  on public.listing_commercials using gin(suitable_for);

-- =====================================================================
-- 6. BUILDING
-- =====================================================================
create table if not exists public.listing_buildings (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  total_area numeric,
  -- characteristics
  total_floors int,
  total_units int,
  units_breakdown jsonb,
  title_type text,
  is_under_lease boolean,
  monthly_revenue bigint,
  ground_floor_use text,
  has_basement boolean,
  has_concierge_apartment boolean,
  -- amenities
  parking_spots int,
  has_elevator boolean,
  has_collective_heating boolean,
  security boolean,
  generator boolean,
  water_tank boolean,
  -- construction
  year_built int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_buildings_total_area  on public.listing_buildings(total_area);
create index if not exists idx_listing_buildings_total_units on public.listing_buildings(total_units);
create index if not exists idx_listing_buildings_under_lease on public.listing_buildings(is_under_lease) where is_under_lease = true;

-- =====================================================================
-- 7. OFFICE
-- =====================================================================
create table if not exists public.listing_offices (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  area numeric,
  -- characteristics
  floor int,
  office_layout text,
  ceiling_height numeric,
  workstation_capacity int,
  meeting_room_count int,
  has_reception_area boolean,
  furnished text,
  -- amenities
  parking_spots int,
  has_elevator boolean,
  is_accessible boolean,
  has_kitchen boolean,
  has_archive_room boolean,
  air_conditioning boolean,
  fiber_internet boolean,
  security boolean,
  -- suitability
  suitable_for text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_offices_area     on public.listing_offices(area);
create index if not exists idx_listing_offices_layout   on public.listing_offices(office_layout);
create index if not exists idx_listing_offices_suitable on public.listing_offices using gin(suitable_for);

-- =====================================================================
-- 8. FARM
-- =====================================================================
create table if not exists public.listing_farms (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- surfaces
  total_area numeric,         -- in hectares (matches farm config unit)
  buildable_area numeric,     -- m²
  house_area numeric,         -- m²
  -- characteristics
  title_type text,
  proximity_to_road_meters numeric,
  soil_type text,
  current_crops text[],
  -- amenities
  has_house boolean,
  has_water_access boolean,
  water_source text,
  irrigation_type text,
  has_electricity boolean,
  has_fencing boolean,
  equipment_included text[],
  livestock_included text[],
  -- construction
  year_built int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_farms_total_area    on public.listing_farms(total_area);
create index if not exists idx_listing_farms_water_access  on public.listing_farms(has_water_access);
create index if not exists idx_listing_farms_electricity   on public.listing_farms(has_electricity);
create index if not exists idx_listing_farms_crops         on public.listing_farms using gin(current_crops);

-- =====================================================================
-- BACKFILL — copy existing flat columns into the new per-type tables.
-- Each statement is idempotent via ON CONFLICT DO NOTHING.
-- =====================================================================

-- 1. APARTMENT
insert into public.listing_apartments (
  listing_id, area, rooms, bedrooms, bathrooms, floor, building_total_floors,
  is_top_floor, orientation, view_type, furnished,
  heating_type, water_tank, balcony, parking, parking_type, elevator,
  fiber_internet, terrace, cave, concierge, security, air_conditioning,
  solar_panels, well, intercom, double_glazing, generator, building_age
)
select
  l.id, l.normalized_area_m2, l.rooms, l.bedrooms, l.bathrooms, l.floor, l.building_total_floors,
  l.is_top_floor, l.orientation, l.view_type, l.furnished,
  l.heating_type, l.water_tank, l.balcony, l.parking, l.parking_type, l.elevator,
  l.fiber_internet, l.terrace, l.cave, l.concierge, l.security, l.air_conditioning,
  l.solar_panels, l.well, l.intercom, l.double_glazing, l.generator, l.building_age
from public.listings l
where l.property_type = 'apartment'
on conflict (listing_id) do nothing;

-- 2. HOUSE
insert into public.listing_houses (
  listing_id, area, land_area, rooms, bedrooms, bathrooms, levels,
  orientation, view_type, furnished, has_basement, pool, heating_type,
  water_tank, garden, garage, parking_type, has_well, boundary_walls,
  has_summer_kitchen, terrace, fiber_internet, security, air_conditioning,
  solar_panels, well, intercom, double_glazing, generator, year_built
)
select
  l.id, l.normalized_area_m2, l.land_area, l.rooms, l.bedrooms, l.bathrooms, l.levels,
  l.orientation, l.view_type, l.furnished, l.has_basement, l.pool, l.heating_type,
  l.water_tank, l.garden, l.garage, l.parking_type, l.has_well, l.boundary_walls,
  l.has_summer_kitchen, l.terrace, l.fiber_internet, l.security, l.air_conditioning,
  l.solar_panels, l.well, l.intercom, l.double_glazing, l.generator, l.year_built
from public.listings l
where l.property_type = 'house'
on conflict (listing_id) do nothing;

-- 3. VILLA
insert into public.listing_villas (
  listing_id, area, land_area, rooms, bedrooms, bathrooms, levels,
  has_servant_quarters, is_gated_community, view_type, furnished, has_basement,
  heating_type, water_tank, garden, pool, has_summer_kitchen, has_summer_living_room,
  has_well, boundary_walls, has_alarm, garage_spots, terrace, fiber_internet,
  security, air_conditioning, solar_panels, well, intercom, double_glazing,
  generator, year_built
)
select
  l.id, l.normalized_area_m2, l.land_area, l.rooms, l.bedrooms, l.bathrooms, l.levels,
  l.has_servant_quarters, l.is_gated_community, l.view_type, l.furnished, l.has_basement,
  l.heating_type, l.water_tank, l.garden, l.pool, l.has_summer_kitchen, l.has_summer_living_room,
  l.has_well, l.boundary_walls, l.has_alarm, l.garage_spots, l.terrace, l.fiber_internet,
  l.security, l.air_conditioning, l.solar_panels, l.well, l.intercom, l.double_glazing,
  l.generator, l.year_built
from public.listings l
where l.property_type = 'villa'
on conflict (listing_id) do nothing;

-- 4. LAND
insert into public.listing_lands (
  listing_id, area, buildable, title_type, corner_plot, slope, frontage_count,
  max_floors_allowed, zoning_type, frontage_meters,
  has_water_access, has_electricity, has_road_access
)
select
  l.id, l.area_value, l.buildable, l.title_type, l.corner_plot, l.slope, l.frontage_count,
  l.max_floors_allowed, l.zoning_type, l.frontage_meters,
  l.has_water_access, l.has_electricity, l.has_road_access
from public.listings l
where l.property_type = 'land'
on conflict (listing_id) do nothing;

-- 5. COMMERCIAL
insert into public.listing_commercials (
  listing_id, area, floor, frontage_meters, has_storefront,
  commercial_license_included, current_activity, entrance_count, ceiling_height,
  has_storage, parking, has_water_meter, has_electricity_meter, has_gas,
  security, air_conditioning, suitable_for, year_built
)
select
  l.id, l.normalized_area_m2, l.floor, l.frontage_meters, l.has_storefront,
  l.commercial_license_included, l.current_activity, l.entrance_count, l.ceiling_height,
  l.has_storage, l.parking, l.has_water_meter, l.has_electricity_meter, l.has_gas,
  l.security, l.air_conditioning, l.suitable_for, l.year_built
from public.listings l
where l.property_type = 'commercial'
on conflict (listing_id) do nothing;

-- 6. BUILDING
insert into public.listing_buildings (
  listing_id, total_area, total_floors, total_units, units_breakdown, title_type,
  is_under_lease, monthly_revenue, ground_floor_use, has_basement, has_concierge_apartment,
  parking_spots, has_elevator, has_collective_heating, security, generator,
  water_tank, year_built
)
select
  l.id, l.total_area, l.total_floors, l.total_units, l.units_breakdown, l.title_type,
  l.is_under_lease, l.monthly_revenue, l.ground_floor_use, l.has_basement, l.has_concierge_apartment,
  l.parking_spots, l.has_elevator, l.has_collective_heating, l.security, l.generator,
  l.water_tank, l.year_built
from public.listings l
where l.property_type = 'building'
on conflict (listing_id) do nothing;

-- 7. OFFICE
insert into public.listing_offices (
  listing_id, area, floor, office_layout, ceiling_height, workstation_capacity,
  meeting_room_count, has_reception_area, furnished,
  parking_spots, has_elevator, is_accessible, has_kitchen, has_archive_room,
  air_conditioning, fiber_internet, security, suitable_for
)
select
  l.id, l.normalized_area_m2, l.floor, l.office_layout, l.ceiling_height, l.workstation_capacity,
  l.meeting_room_count, l.has_reception_area, l.furnished,
  l.parking_spots, l.has_elevator, l.is_accessible, l.has_kitchen, l.has_archive_room,
  l.air_conditioning, l.fiber_internet, l.security, l.suitable_for
from public.listings l
where l.property_type = 'office'
on conflict (listing_id) do nothing;

-- 8. FARM
insert into public.listing_farms (
  listing_id, total_area, buildable_area, house_area,
  title_type, proximity_to_road_meters, soil_type, current_crops,
  has_house, has_water_access, water_source, irrigation_type,
  has_electricity, has_fencing, equipment_included, livestock_included, year_built
)
select
  l.id, l.total_area, l.buildable_area, l.house_area,
  l.title_type, l.proximity_to_road_meters, l.soil_type, l.current_crops,
  l.has_house, l.has_water_access, l.water_source, l.irrigation_type,
  l.has_electricity, l.has_fencing, l.equipment_included, l.livestock_included, l.year_built
from public.listings l
where l.property_type = 'farm'
on conflict (listing_id) do nothing;

-- =====================================================================
-- updated_at triggers (re-use existing trigger function from 0010)
-- =====================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'listing_apartments','listing_houses','listing_villas','listing_lands',
    'listing_commercials','listing_buildings','listing_offices','listing_farms'
  ] loop
    execute format($f$
      drop trigger if exists set_updated_at on public.%1$I;
      create trigger set_updated_at before update on public.%1$I
        for each row execute function public.set_updated_at();
    $f$, t);
  end loop;
end$$;