// listingList — query Supabase `listings`, return Base44-entity-shaped rows.
// All type-specific fields are real columns now, so `query` keys map directly
// onto column names (with a few aliases). Unknown keys are ignored.
//
// Payload: { query?: object, sort?: string, limit?: number }

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const LISTING_COLUMNS = new Set([
  'title','description','listing_type','property_type','price',
  'wilaya','commune','address','status','is_exclusive',
  'contact_name','contact_phone','contact_email',
  'admin_note','active_since','is_featured','views_count',
  'agent_id','owner_is_verified','owner_verification_type',
  'exclusivity_conflict','conflict_listing_id',
  'hide_price','hide_location','price_period','currency',
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
  'ground_floor_use','current_activity','water_source','irrigation_type','soil_type',
]);

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

function getSupabaseClient() {
  const url = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), {
    auth: { persistSession: false },
  });
}

function resolveSortColumn(field) {
  if (field === 'created_date') return 'created_at';
  if (field === 'updated_date') return 'updated_at';
  if (field === 'area') return 'normalized_area_m2';
  if (LISTING_COLUMNS.has(field) || ['created_at', 'updated_at', 'normalized_area_m2'].includes(field)) {
    return field;
  }
  return 'created_at';
}

function flattenRow(row, ownerEmail) {
  const photos = (row.listing_photos || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
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
    const { query = {}, sort = '-created_date', limit = 100 } =
      await req.json().catch(() => ({}));

    const sb = getSupabaseClient();

    let q = sb
      .from('listings')
      .select('*, listing_photos(url, watermarked_url, position, is_cover)');

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;

      if (key === 'created_by') {
        const { data: prof } = await sb.from('profiles').select('id').eq('email', value).maybeSingle();
        if (!prof) return Response.json([]);
        q = q.eq('owner_id', prof.id);
      } else if (key === 'id') {
        q = q.eq('id', value);
      } else if (key === 'area') {
        q = q.eq('area_value', value);
      } else if (LISTING_COLUMNS.has(key)) {
        q = q.eq(key, value);
      }
    }

    const desc = sort.startsWith('-');
    const rawField = desc ? sort.slice(1) : sort;
    const column = resolveSortColumn(rawField);
    q = q.order(column, { ascending: !desc, nullsFirst: false });
    q = q.limit(Math.min(limit || 100, 500));

    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const ownerIds = [...new Set((data || []).map(r => r.owner_id).filter(Boolean))];
    let emailById = {};
    if (ownerIds.length > 0) {
      const { data: profs } = await sb.from('profiles').select('id, email').in('id', ownerIds);
      emailById = Object.fromEntries((profs || []).map(p => [p.id, p.email]));
    }

    const rows = (data || []).map(r => flattenRow(r, emailById[r.owner_id] || null));
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});