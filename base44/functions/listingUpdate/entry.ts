// listingUpdate — partial update of a listing.
// All type-specific fields are now real columns. Unknown keys are dropped.
//
// Payload: { id: string, data: <partial Base44 listing object> }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const LISTING_COLUMNS = new Set([
  'title', 'description', 'listing_type', 'property_type', 'price',
  'wilaya', 'commune', 'address', 'status', 'is_exclusive',
  'contact_name', 'contact_phone', 'contact_email', 'contact_whatsapp',
  'show_phone', 'show_email', 'rental_period', 'price_negotiable',
  'price_display', 'watermark_status', 'rejection_reason',

  'admin_note', 'active_since', 'is_featured', 'views_count',
  'agent_id', 'owner_is_verified', 'owner_verification_type',
  'exclusivity_conflict', 'conflict_listing_id', 'audit_log',
  'hide_price', 'hide_location', 'price_period', 'currency', 'features',

  'land_area', 'total_area', 'buildable_area', 'house_area',
  'rooms', 'bedrooms', 'bathrooms', 'floor', 'building_total_floors',
  'total_floors', 'total_units', 'levels', 'garage_spots', 'parking_spots',
  'frontage_meters', 'frontage_count', 'max_floors_allowed', 'entrance_count',
  'ceiling_height', 'workstation_capacity', 'meeting_room_count',
  'proximity_to_road_meters', 'monthly_revenue', 'building_age', 'year_built',

  'is_top_floor', 'water_tank', 'balcony', 'parking', 'elevator',
  'fiber_internet', 'terrace', 'cave', 'concierge', 'security',
  'air_conditioning', 'solar_panels', 'well', 'intercom', 'double_glazing',
  'generator', 'has_basement', 'pool', 'garden', 'garage', 'has_well',
  'boundary_walls', 'has_summer_kitchen', 'has_summer_living_room',
  'has_alarm', 'has_servant_quarters', 'is_gated_community',
  'buildable', 'corner_plot', 'has_water_access', 'has_electricity',
  'has_road_access', 'has_storefront', 'commercial_license_included',
  'has_storage', 'has_water_meter', 'has_electricity_meter', 'has_gas',
  'is_under_lease', 'has_concierge_apartment', 'has_elevator',
  'has_collective_heating', 'has_reception_area', 'is_accessible',
  'has_kitchen', 'has_archive_room', 'has_house', 'has_fencing',

  'furnished', 'heating_type', 'parking_type', 'title_type', 'slope',
  'zoning_type', 'office_layout', 'ground_floor_use', 'current_activity',
  'water_source', 'irrigation_type', 'soil_type',

  'orientation', 'view_type', 'suitable_for', 'current_crops',
  'equipment_included', 'livestock_included',

  'units_breakdown',
]);

const KEY_ALIASES = { area: 'area_value' };
const DROPPED_KEYS = new Set([
  'id', 'created_date', 'updated_date', 'created_by',
  'attributes', 'images',
]);

function mapPayloadToRow(data) {
  const row = {};
  if (data.attributes && typeof data.attributes === 'object') {
    for (const [k, v] of Object.entries(data.attributes)) {
      const mapped = KEY_ALIASES[k] || k;
      if (LISTING_COLUMNS.has(mapped) || mapped === 'area_value') row[mapped] = v;
    }
  }
  for (const [k, v] of Object.entries(data)) {
    if (DROPPED_KEYS.has(k)) continue;
    const mapped = KEY_ALIASES[k] || k;
    if (LISTING_COLUMNS.has(mapped) || mapped === 'area_value') row[mapped] = v;
  }
  return row;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, data } = await req.json();
    if (!id || !data) return Response.json({ error: 'id and data required' }, { status: 400 });

    const sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    const { data: existing, error: fetchErr } = await sb
      .from('listings')
      .select('id, owner_id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin') {
      const { data: prof } = await sb.from('profiles').select('id').eq('email', user.email).maybeSingle();
      if (!prof || prof.id !== existing.owner_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const row = mapPayloadToRow(data);
    row.updated_at = new Date().toISOString();

    if (Object.keys(row).length > 1) {
      const { error: upErr } = await sb.from('listings').update(row).eq('id', id);
      if (upErr) return Response.json({ error: upErr.message }, { status: 500 });
    }

    if (Array.isArray(data.images)) {
      await sb.from('listing_photos').delete().eq('listing_id', id);
      if (data.images.length > 0) {
        const photoRows = data.images.map((url, i) => ({
          listing_id: id, url, position: i, is_cover: i === 0,
        }));
        await sb.from('listing_photos').insert(photoRows);
      }
    }

    return Response.json({ id, ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});