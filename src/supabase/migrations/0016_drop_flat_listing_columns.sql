-- =====================================================================
-- 0016_drop_flat_listing_columns.sql
--
-- Now that all type-specific attributes live in the dedicated per-type
-- tables (listing_apartments, listing_houses, listing_villas, listing_lands,
-- listing_commercials, listing_buildings, listing_offices, listing_farms),
-- drop the flat fallback columns from `listings`.
--
-- Columns that STAY on `listings` (shared / cross-cutting):
--   identity:    id, title, description, listing_type, property_type, price
--   location:    wilaya, commune, address, latitude, longitude, hide_location
--   contact:     contact_name, contact_phone, contact_email, contact_whatsapp,
--                show_phone, show_email
--   pricing:     price_period, price_negotiable, price_display, hide_price,
--                rental_period, currency
--   surface:     area_value, area_unit, normalized_area_m2  (kept for
--                cross-type sort/filter — per-type tables also store area)
--   workflow:    status, watermark_status, rejection_reason, submitted_at,
--                active_since, admin_note, is_featured, views_count,
--                is_exclusive, exclusivity_conflict, conflict_listing_id,
--                audit_log, owner_id, agent_id, owner_is_verified,
--                owner_verification_type
--   misc:        features (cross-type tags), created_at, updated_at
--
-- Run this only after deploying the updated listingCreate / listingUpdate /
-- listingGet / listingList functions that write to and read from the
-- per-type tables.
-- =====================================================================

-- Drop indexes that reference columns we're about to drop.
drop index if exists public.idx_listings_bedrooms;
drop index if exists public.idx_listings_bathrooms;

alter table public.listings
  -- numeric type-specific
  drop column if exists land_area,
  drop column if exists total_area,
  drop column if exists buildable_area,
  drop column if exists house_area,
  drop column if exists rooms,
  drop column if exists bedrooms,
  drop column if exists bathrooms,
  drop column if exists floor,
  drop column if exists building_total_floors,
  drop column if exists total_floors,
  drop column if exists total_units,
  drop column if exists levels,
  drop column if exists garage_spots,
  drop column if exists parking_spots,
  drop column if exists frontage_meters,
  drop column if exists frontage_count,
  drop column if exists max_floors_allowed,
  drop column if exists entrance_count,
  drop column if exists ceiling_height,
  drop column if exists workstation_capacity,
  drop column if exists meeting_room_count,
  drop column if exists proximity_to_road_meters,
  drop column if exists monthly_revenue,
  drop column if exists building_age,
  drop column if exists year_built,

  -- boolean amenities
  drop column if exists is_top_floor,
  drop column if exists water_tank,
  drop column if exists balcony,
  drop column if exists parking,
  drop column if exists elevator,
  drop column if exists fiber_internet,
  drop column if exists terrace,
  drop column if exists cave,
  drop column if exists concierge,
  drop column if exists security,
  drop column if exists air_conditioning,
  drop column if exists solar_panels,
  drop column if exists well,
  drop column if exists intercom,
  drop column if exists double_glazing,
  drop column if exists generator,
  drop column if exists has_basement,
  drop column if exists pool,
  drop column if exists garden,
  drop column if exists garage,
  drop column if exists has_well,
  drop column if exists boundary_walls,
  drop column if exists has_summer_kitchen,
  drop column if exists has_summer_living_room,
  drop column if exists has_alarm,
  drop column if exists has_servant_quarters,
  drop column if exists is_gated_community,
  drop column if exists buildable,
  drop column if exists corner_plot,
  drop column if exists has_water_access,
  drop column if exists has_electricity,
  drop column if exists has_road_access,
  drop column if exists has_storefront,
  drop column if exists commercial_license_included,
  drop column if exists has_storage,
  drop column if exists has_water_meter,
  drop column if exists has_electricity_meter,
  drop column if exists has_gas,
  drop column if exists is_under_lease,
  drop column if exists has_concierge_apartment,
  drop column if exists has_elevator,
  drop column if exists has_collective_heating,
  drop column if exists has_reception_area,
  drop column if exists is_accessible,
  drop column if exists has_kitchen,
  drop column if exists has_archive_room,
  drop column if exists has_house,
  drop column if exists has_fencing,

  -- enum / text type-specific
  drop column if exists furnished,
  drop column if exists heating_type,
  drop column if exists parking_type,
  drop column if exists title_type,
  drop column if exists slope,
  drop column if exists zoning_type,
  drop column if exists office_layout,
  drop column if exists ground_floor_use,
  drop column if exists current_activity,
  drop column if exists water_source,
  drop column if exists irrigation_type,
  drop column if exists soil_type,

  -- multi_enum arrays
  drop column if exists orientation,
  drop column if exists view_type,
  drop column if exists suitable_for,
  drop column if exists current_crops,
  drop column if exists equipment_included,
  drop column if exists livestock_included,

  -- structured composition
  drop column if exists units_breakdown;