// listingList — query Supabase `listings`, return Base44-entity-shaped rows.
// Payload: { query?: object, sort?: string, limit?: number }

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const ATTR_FIELDS = new Set([
  'rooms', 'bedrooms', 'bathrooms', 'floor', 'total_floors', 'year_built',
  'furnished', 'features', 'currency', 'hide_price', 'price_period',
  'views_count', 'is_featured', 'admin_note', 'audit_log',
  'agent_id', 'owner_is_verified', 'owner_verification_type', 'active_since',
  'exclusivity_conflict', 'conflict_listing_id', 'hide_location',
  'frontage_meters', 'total_units',
]);

function getSupabaseClient() {
  let url = Deno.env.get('supabase_base_url') || '';
  // Strip "/rest/v1/" or trailing slashes — supabase-js wants the project root
  url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), {
    auth: { persistSession: false },
  });
}

function resolveSortColumn(field) {
  if (field === 'created_date') return 'created_at';
  if (field === 'updated_date') return 'updated_at';
  if (field === 'area') return 'normalized_area_m2';
  if (['price', 'title', 'wilaya', 'commune', 'listing_type', 'property_type', 'status', 'created_at', 'updated_at'].includes(field)) {
    return field;
  }
  return 'created_at';
}

function flattenRow(row, ownerEmail) {
  const attrs = row.attributes || {};
  const photos = (row.listing_photos || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
  return {
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: ownerEmail,
    title: row.title,
    description: row.description,
    listing_type: row.listing_type,
    property_type: row.property_type,
    price: row.price,
    price_period: attrs.price_period || 'total',
    currency: attrs.currency || 'DZD',
    hide_price: attrs.hide_price || false,
    area: row.area_value,
    rooms: attrs.rooms,
    bedrooms: attrs.bedrooms,
    bathrooms: attrs.bathrooms,
    floor: attrs.floor,
    total_floors: attrs.total_floors,
    wilaya: row.wilaya,
    commune: row.commune,
    address: row.address,
    hide_location: attrs.hide_location !== undefined ? attrs.hide_location : true,
    images: photos.map(p => p.watermarked_url || p.url),
    features: attrs.features || [],
    attributes: attrs,
    status: row.status,
    admin_note: attrs.admin_note,
    is_featured: attrs.is_featured || false,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    agent_id: attrs.agent_id,
    year_built: attrs.year_built,
    furnished: attrs.furnished,
    views_count: attrs.views_count || 0,
    owner_is_verified: attrs.owner_is_verified || false,
    owner_verification_type: attrs.owner_verification_type,
    active_since: attrs.active_since,
    is_exclusive: row.is_exclusive,
    exclusivity_conflict: attrs.exclusivity_conflict || false,
    conflict_listing_id: attrs.conflict_listing_id,
    audit_log: attrs.audit_log || [],
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
      } else if (ATTR_FIELDS.has(key)) {
        q = q.eq(`attributes->>${key}`, String(value));
      } else if (['title', 'description', 'listing_type', 'property_type', 'wilaya', 'commune', 'status'].includes(key)) {
        q = q.eq(key, value);
      } else if (key === 'area') {
        q = q.eq('area_value', value);
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