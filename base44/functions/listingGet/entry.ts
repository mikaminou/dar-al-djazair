// listingGet — fetch a single listing by id, returns Base44-shaped row.
// All type-specific fields are real columns now; we just spread row + add
// computed derived fields (images, attributes mirror, area).
//
// Payload: { id: string }

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Mirror of listing columns used to rebuild a virtual `attributes` object
// for clients that still read it (DynamicFieldDisplay etc. now read columns
// directly, but this keeps backwards compat for any caller that expects it).
const ATTR_MIRROR_KEYS = [
  'land_area','total_area','buildable_area','house_area',
  'rooms','bedrooms','bathrooms','floor','building_total_floors',
  'total_floors','total_units','levels','garage_spots','parking_spots',
  'frontage_meters','frontage_count','max_floors_allowed','entrance_count',
  'ceiling_height','workstation_capacity','meeting_room_count',
  'proximity_to_road_meters','monthly_revenue','building_age','year_built',
  'is_top_floor','water_tank','balcony','parking','elevator','fiber_internet',
  'terrace','cave','concierge','security','air_conditioning','solar_panels',
  'well','intercom','double_glazing','generator','has_basement','pool','garden',
  'garage','has_well','boundary_walls','has_summer_kitchen','has_summer_living_room',
  'has_alarm','has_servant_quarters','is_gated_community','buildable','corner_plot',
  'has_water_access','has_electricity','has_road_access','has_storefront',
  'commercial_license_included','has_storage','has_water_meter','has_electricity_meter',
  'has_gas','is_under_lease','has_concierge_apartment','has_elevator',
  'has_collective_heating','has_reception_area','is_accessible','has_kitchen',
  'has_archive_room','has_house','has_fencing','furnished','heating_type',
  'parking_type','title_type','slope','zoning_type','office_layout',
  'ground_floor_use','current_activity','water_source','irrigation_type',
  'soil_type','orientation','view_type','suitable_for','current_crops',
  'equipment_included','livestock_included','units_breakdown',
];

function flattenRow(row, ownerEmail) {
  const photos = (row.listing_photos || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));

  // Build a virtual attributes object for legacy callers.
  const attributes = { area: row.area_value };
  for (const k of ATTR_MIRROR_KEYS) {
    if (row[k] !== null && row[k] !== undefined) attributes[k] = row[k];
  }

  return {
    ...row,
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: ownerEmail,
    area: row.area_value,
    images: photos.map(p => p.watermarked_url || p.url),
    features: row.features || [],
    audit_log: row.audit_log || [],
    attributes,
    listing_photos: undefined,
  };
}

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    const { data: row, error } = await sb
      .from('listings')
      .select('*, listing_photos(url, watermarked_url, position, is_cover)')
      .eq('id', id)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    let ownerEmail = null;
    if (row.owner_id) {
      const { data: p } = await sb.from('profiles').select('email').eq('id', row.owner_id).maybeSingle();
      ownerEmail = p?.email || null;
    }

    return Response.json(flattenRow(row, ownerEmail));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});