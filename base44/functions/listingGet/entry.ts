// listingGet — fetch a single listing by id, returns Base44-shaped row.
//
// Joins the per-property-type table to merge type-specific attributes back
// into the response (so callers continue to see e.g. `bedrooms`, `pool`,
// `furnished` directly on the listing object and inside `attributes`).
//
// Payload: { id: string }

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Map property_type → child table name.
const TYPE_TABLES = {
  apartment:  'listing_apartments',
  house:      'listing_houses',
  villa:      'listing_villas',
  land:       'listing_lands',
  commercial: 'listing_commercials',
  building:   'listing_buildings',
  office:     'listing_offices',
  farm:       'listing_farms',
};

// Strip per-type bookkeeping columns before merging.
const STRIP = new Set(['listing_id', 'created_at', 'updated_at']);

function flattenRow(row, typeRow, ownerEmail) {
  const photos = (row.listing_photos || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));

  // Merge per-type fields onto the listing object.
  const typeFields = {};
  if (typeRow) {
    for (const [k, v] of Object.entries(typeRow)) {
      if (STRIP.has(k)) continue;
      if (v !== null && v !== undefined) typeFields[k] = v;
    }
  }

  // Build a virtual `attributes` mirror for legacy callers.
  const attributes = { area: row.area_value, ...typeFields };

  return {
    ...row,
    ...typeFields,
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

    // Fetch the per-type child row (if any).
    let typeRow = null;
    const childTable = TYPE_TABLES[row.property_type];
    if (childTable) {
      const { data: tr } = await sb
        .from(childTable)
        .select('*')
        .eq('listing_id', id)
        .maybeSingle();
      typeRow = tr || null;
    }

    let ownerEmail = null;
    if (row.owner_id) {
      const { data: p } = await sb.from('profiles').select('email').eq('id', row.owner_id).maybeSingle();
      ownerEmail = p?.email || null;
    }

    return Response.json(flattenRow(row, typeRow, ownerEmail));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});