// listingUpdate — partial update of a listing.
//
// Storage model:
//   • `listings`           — shared/cross-cutting columns only.
//   • `listing_<type>`     — type-specific attributes (one row per listing).
//
// Payload: { id: string, data: <partial Base44 listing object> }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const LISTING_COLUMNS = new Set([
  'title', 'description', 'listing_type', 'property_type', 'price',
  'wilaya', 'commune', 'address', 'latitude', 'longitude',
  'status', 'is_exclusive',
  'contact_name', 'contact_phone', 'contact_email', 'contact_whatsapp',
  'show_phone', 'show_email',
  'rental_period', 'price_negotiable', 'price_display',
  'hide_price', 'price_period', 'currency', 'hide_location',
  'admin_note', 'active_since', 'is_featured', 'views_count',
  'agent_id', 'owner_is_verified', 'owner_verification_type',
  'exclusivity_conflict', 'conflict_listing_id', 'audit_log',
  'watermark_status', 'rejection_reason',
  'features',
]);

const KEY_ALIASES = { area: 'area_value' };
const DROPPED_KEYS = new Set([
  'id', 'created_date', 'updated_date', 'created_by',
  'attributes', 'images',
]);

const TYPE_TABLE_COLUMNS = {
  apartment: {
    table: 'listing_apartments',
    columns: ['area','rooms','bedrooms','bathrooms','floor','building_total_floors','is_top_floor','orientation','view_type','furnished','heating_type','water_tank','balcony','parking','parking_type','elevator','fiber_internet','terrace','cave','concierge','security','air_conditioning','solar_panels','well','intercom','double_glazing','generator','building_age'],
  },
  house: {
    table: 'listing_houses',
    columns: ['area','land_area','rooms','bedrooms','bathrooms','levels','orientation','view_type','furnished','has_basement','pool','heating_type','water_tank','garden','garage','parking_type','has_well','boundary_walls','has_summer_kitchen','terrace','fiber_internet','security','air_conditioning','solar_panels','well','intercom','double_glazing','generator','year_built'],
  },
  villa: {
    table: 'listing_villas',
    columns: ['area','land_area','rooms','bedrooms','bathrooms','levels','has_servant_quarters','is_gated_community','view_type','furnished','has_basement','heating_type','water_tank','garden','pool','has_summer_kitchen','has_summer_living_room','has_well','boundary_walls','has_alarm','garage_spots','terrace','fiber_internet','security','air_conditioning','solar_panels','well','intercom','double_glazing','generator','year_built'],
  },
  land: {
    table: 'listing_lands',
    columns: ['area','buildable','title_type','corner_plot','slope','frontage_count','max_floors_allowed','zoning_type','frontage_meters','has_water_access','has_electricity','has_road_access'],
  },
  commercial: {
    table: 'listing_commercials',
    columns: ['area','floor','frontage_meters','has_storefront','commercial_license_included','current_activity','entrance_count','ceiling_height','has_storage','parking','has_water_meter','has_electricity_meter','has_gas','security','air_conditioning','suitable_for','year_built'],
  },
  building: {
    table: 'listing_buildings',
    columns: ['total_area','total_floors','total_units','units_breakdown','title_type','is_under_lease','monthly_revenue','ground_floor_use','has_basement','has_concierge_apartment','parking_spots','has_elevator','has_collective_heating','security','generator','water_tank','year_built'],
  },
  office: {
    table: 'listing_offices',
    columns: ['area','floor','office_layout','ceiling_height','workstation_capacity','meeting_room_count','has_reception_area','furnished','parking_spots','has_elevator','is_accessible','has_kitchen','has_archive_room','air_conditioning','fiber_internet','security','suitable_for'],
  },
  farm: {
    table: 'listing_farms',
    columns: ['total_area','buildable_area','house_area','title_type','proximity_to_road_meters','soil_type','current_crops','has_house','has_water_access','water_source','irrigation_type','has_electricity','has_fencing','equipment_included','livestock_included','year_built'],
  },
};

function extractTypeFields(propertyType, data) {
  const cfg = TYPE_TABLE_COLUMNS[propertyType];
  if (!cfg) return null;
  const merged = { ...(data.attributes || {}), ...data };
  const out = {};
  let touched = false;
  for (const col of cfg.columns) {
    if (col === 'area') continue; // computed from listingRow below
    if (merged[col] !== undefined) {
      out[col] = merged[col];
      touched = true;
    }
  }
  return { table: cfg.table, row: out, touched };
}

async function syncTypeTable(sb, listingRow, data) {
  const built = extractTypeFields(listingRow.property_type, data);
  if (!built) return;

  const propertyType = listingRow.property_type;
  // If the area or property_type changed, refresh per-type `area`.
  if (propertyType !== 'building' && propertyType !== 'farm') {
    const v = propertyType === 'land' ? listingRow.area_value : listingRow.normalized_area_m2;
    if (v !== undefined && v !== null) built.row.area = v;
  }

  // Always upsert (creates the per-type row on first update if missing).
  const payload = { ...built.row, listing_id: listingRow.id };
  await sb.from(built.table).upsert(payload, { onConflict: 'listing_id' });
}

function mapPayloadToListingRow(data) {
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

    const row = mapPayloadToListingRow(data);
    row.updated_at = new Date().toISOString();

    if (Object.keys(row).length > 1) {
      const { error: upErr } = await sb.from('listings').update(row).eq('id', id);
      if (upErr) return Response.json({ error: upErr.message }, { status: 500 });
    }

    // Re-fetch the canonical row and mirror into the per-property-type table.
    const { data: fresh } = await sb.from('listings').select('*').eq('id', id).maybeSingle();
    if (fresh) await syncTypeTable(sb, fresh, data);

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