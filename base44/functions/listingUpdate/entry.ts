// listingUpdate — partial update of a listing.
// Payload: { id: string, data: <partial Base44 listing object> }

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, data } = await req.json();
    if (!id || !data) return Response.json({ error: 'id and data required' }, { status: 400 });

    let sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    // Fetch existing for ownership check + merging attributes
    const { data: existing, error: fetchErr } = await sb
      .from('listings')
      .select('id, owner_id, attributes')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    // Owner check (admins always allowed)
    if (user.role !== 'admin') {
      const { data: prof } = await sb.from('profiles').select('id').eq('email', user.email).maybeSingle();
      if (!prof || prof.id !== existing.owner_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build partial update
    const row = {};
    const attributes = { ...(existing.attributes || {}) };
    let touchedAttrs = false;

    for (const [key, value] of Object.entries(data)) {
      if (key === 'attributes' || key === 'images' || key === 'id' ||
          key === 'created_date' || key === 'updated_date' || key === 'created_by') continue;
      if (FLAT_COLUMNS.has(key)) row[key] = value;
      else if (key === 'area') row.area_value = value;
      else if (ATTR_FIELDS.has(key)) { attributes[key] = value; touchedAttrs = true; }
    }
    if (data.attributes && typeof data.attributes === 'object') {
      Object.assign(attributes, data.attributes);
      touchedAttrs = true;
    }
    if (touchedAttrs) row.attributes = attributes;
    row.updated_at = new Date().toISOString();

    if (Object.keys(row).length > 1) {
      const { error: upErr } = await sb.from('listings').update(row).eq('id', id);
      if (upErr) return Response.json({ error: upErr.message }, { status: 500 });
    }

    // Sync images if provided — replace strategy
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