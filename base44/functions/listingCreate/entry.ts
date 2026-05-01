// listingCreate — create a listing in Supabase from Base44-shaped payload.
// Packs flat fields → columns + attributes JSONB; syncs images[] to listing_photos.
// Payload: { data: <Base44 listing object> }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const FLAT_COLUMNS = new Set([
  'title', 'description', 'listing_type', 'property_type', 'price',
  'wilaya', 'commune', 'address', 'status', 'is_exclusive',
  'contact_name', 'contact_phone', 'contact_email',
]);
const ATTR_FIELDS = new Set([
  'rooms', 'bedrooms', 'bathrooms', 'floor', 'total_floors', 'year_built',
  'furnished', 'features', 'currency', 'hide_price', 'price_period',
  'views_count', 'is_featured', 'admin_note', 'audit_log',
  'agent_id', 'owner_is_verified', 'owner_verification_type', 'active_since',
  'exclusivity_conflict', 'conflict_listing_id', 'hide_location',
  'frontage_meters', 'total_units',
]);

// Ensure a profiles row exists for an email; returns profile id
async function ensureProfile(sb, email, fullName) {
  const { data: existing } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing?.id) return existing.id;
  const id = crypto.randomUUID();
  const [first_name, ...rest] = (fullName || '').split(' ');
  const { data, error } = await sb.from('profiles').insert({
    id, email, first_name: first_name || null, last_name: rest.join(' ') || null,
  }).select('id').single();
  if (error) throw new Error(`profiles insert: ${error.message}`);
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await req.json();
    if (!data) return Response.json({ error: 'data required' }, { status: 400 });

    let sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    const ownerId = await ensureProfile(sb, user.email, user.full_name);

    // Build columns + attributes
    const row = { owner_id: ownerId };
    const attributes = { ...(data.attributes || {}) };

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === 'attributes' || key === 'images' || key === 'id' ||
          key === 'created_date' || key === 'updated_date' || key === 'created_by') continue;
      if (FLAT_COLUMNS.has(key)) row[key] = value;
      else if (key === 'area') row.area_value = value;
      else if (ATTR_FIELDS.has(key)) attributes[key] = value;
    }
    if (!row.area_unit && row.area_value !== undefined) row.area_unit = 'm2';
    row.attributes = attributes;
    row.submitted_at = new Date().toISOString();

    const { data: inserted, error } = await sb.from('listings').insert(row).select('*').single();
    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Sync images
    if (Array.isArray(data.images) && data.images.length > 0) {
      const photoRows = data.images.map((url, i) => ({
        listing_id: inserted.id, url, position: i, is_cover: i === 0,
      }));
      await sb.from('listing_photos').insert(photoRows);
    }

    return Response.json({ id: inserted.id, ...data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});