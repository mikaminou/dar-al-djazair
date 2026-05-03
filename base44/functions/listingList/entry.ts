// listingList — query Supabase `listings`, return Base44-entity-shaped rows.
//
// `listings` now holds only shared/cross-cutting columns. Type-specific
// attributes live in per-type child tables and are merged into each row's
// response (and into a virtual `attributes` mirror for legacy callers).
//
// Filtering by type-specific fields (e.g. bedrooms, pool) requires per-type
// joins — out of scope for this generic list endpoint, which sticks to
// shared-column filters. Callers needing those filters should query the
// per-type table directly.
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
  'watermark_status','rejection_reason',
]);

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

const STRIP = new Set(['listing_id', 'created_at', 'updated_at']);

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
  if (LISTING_COLUMNS.has(field) || ['created_at', 'updated_at', 'normalized_area_m2', 'price'].includes(field)) {
    return field;
  }
  return 'created_at';
}

function flattenRow(row, typeRow, ownerEmail) {
  const photos = (row.listing_photos || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));

  const typeFields = {};
  if (typeRow) {
    for (const [k, v] of Object.entries(typeRow)) {
      if (STRIP.has(k)) continue;
      if (v !== null && v !== undefined) typeFields[k] = v;
    }
  }

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
      // Type-specific filters silently ignored — see file header.
    }

    const desc = sort.startsWith('-');
    const rawField = desc ? sort.slice(1) : sort;
    const column = resolveSortColumn(rawField);
    q = q.order(column, { ascending: !desc, nullsFirst: false });
    q = q.limit(Math.min(limit || 100, 500));

    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = data || [];

    // Resolve owner emails in bulk.
    const ownerIds = [...new Set(rows.map(r => r.owner_id).filter(Boolean))];
    let emailById = {};
    if (ownerIds.length > 0) {
      const { data: profs } = await sb.from('profiles').select('id, email').in('id', ownerIds);
      emailById = Object.fromEntries((profs || []).map(p => [p.id, p.email]));
    }

    // Bulk-fetch per-type child rows, grouped by property_type to avoid N+1.
    const idsByType = {};
    for (const r of rows) {
      const t = r.property_type;
      if (!TYPE_TABLES[t]) continue;
      (idsByType[t] ||= []).push(r.id);
    }
    const typeRowById = {};
    await Promise.all(Object.entries(idsByType).map(async ([t, ids]) => {
      const { data: trs } = await sb.from(TYPE_TABLES[t]).select('*').in('listing_id', ids);
      for (const tr of trs || []) typeRowById[tr.listing_id] = tr;
    }));

    const out = rows.map(r => flattenRow(r, typeRowById[r.id] || null, emailById[r.owner_id] || null));
    return Response.json(out);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});