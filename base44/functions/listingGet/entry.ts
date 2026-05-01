// listingGet — fetch a single listing by id, returns Base44-shaped row.
// Payload: { id: string }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    let sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    const { data: row, error } = await sb
      .from('listings')
      .select('*, listing_photos(url, watermarked_url, position, is_cover)')
      .eq('id', id)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    // Owner email
    let ownerEmail = null;
    if (row.owner_id) {
      const { data: p } = await sb.from('profiles').select('email').eq('id', row.owner_id).maybeSingle();
      ownerEmail = p?.email || null;
    }

    const attrs = row.attributes || {};
    const photos = (row.listing_photos || []).sort((a, b) => (a.position || 0) - (b.position || 0));
    const flat = {
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
    return Response.json(flat);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});