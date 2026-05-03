import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Agency offices: relational entity, owned by an agency profile.
// Frontend speaks `agent_email`; we resolve it to `agency_id` (FK to profiles)
// on writes and derive it on reads.

const TABLE = 'agency_offices';
const ALLOWED_FIELDS = [
  'wilaya', 'commune', 'address', 'phone', 'email',
  'office_label', 'is_primary', 'is_verified', 'display_order'
];

function getSupabase() {
  let url = Deno.env.get('supabase_base_url') || '';
  url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });
}

function pickFields(payload) {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (payload[k] !== undefined) out[k] = payload[k];
  return out;
}

async function resolveAgencyId(sb, email) {
  if (!email) return null;
  const { data, error } = await sb.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

function mapRow(row, agentEmail) {
  if (!row) return null;
  return {
    id: row.id,
    agent_email: agentEmail || null,
    wilaya: row.wilaya,
    commune: row.commune,
    address: row.address,
    phone: row.phone,
    email: row.email,
    office_label: row.office_label,
    is_primary: row.is_primary || false,
    is_verified: row.is_verified || false,
    display_order: row.display_order || 0,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: agentEmail || null,
  };
}

async function rowsWithAgentEmail(sb, rows) {
  if (!rows || rows.length === 0) return [];
  const ids = [...new Set(rows.map(r => r.agency_id).filter(Boolean))];
  const { data: profs } = ids.length
    ? await sb.from('profiles').select('id,email').in('id', ids)
    : { data: [] };
  const idToEmail = Object.fromEntries((profs || []).map(p => [p.id, p.email]));
  return rows.map(r => mapRow(r, idToEmail[r.agency_id]));
}

// If the new/updated office is_primary, unset is_primary on the agency's other offices.
async function ensureSinglePrimary(sb, agencyId, exceptId) {
  let q = sb.from(TABLE).update({ is_primary: false }).eq('agency_id', agencyId).eq('is_primary', true);
  if (exceptId) q = q.neq('id', exceptId);
  await q;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { operation, id, data, query, sort, limit } = body;
    const sb = getSupabase();

    if (operation === 'list') {
      let q = sb.from(TABLE).select('*');
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          if (k === 'agent_email') {
            const aid = await resolveAgencyId(sb, v);
            if (!aid) return Response.json([]);
            q = q.eq('agency_id', aid);
          } else if (ALLOWED_FIELDS.includes(k) || k === 'agency_id' || k === 'id') {
            q = q.eq(k, v);
          }
        }
      }
      if (sort) {
        const desc = sort.startsWith('-');
        q = q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
      } else {
        q = q.order('is_primary', { ascending: false }).order('display_order', { ascending: true });
      }
      if (limit) q = q.limit(limit);
      const { data: rows, error } = await q;
      if (error) throw error;
      return Response.json(await rowsWithAgentEmail(sb, rows));
    }

    if (operation === 'get') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      const [mapped] = await rowsWithAgentEmail(sb, row ? [row] : []);
      return Response.json(mapped || null);
    }

    if (operation === 'create') {
      const agencyEmail = data?.agent_email || user.email;
      const agencyId = await resolveAgencyId(sb, agencyEmail);
      if (!agencyId) return Response.json({ error: 'Agency profile not found' }, { status: 400 });

      // First office for this agency? Force is_primary=true.
      const { count } = await sb.from(TABLE).select('id', { count: 'exact', head: true }).eq('agency_id', agencyId);
      const insertPayload = { ...pickFields(data || {}), agency_id: agencyId };
      if (!count) insertPayload.is_primary = true;

      // Ensure single primary
      if (insertPayload.is_primary) await ensureSinglePrimary(sb, agencyId);

      const { data: row, error } = await sb.from(TABLE).insert(insertPayload).select().single();
      if (error) throw error;
      return Response.json(mapRow(row, agencyEmail));
    }

    if (operation === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const updatePayload = pickFields(data || {});

      // If setting is_primary=true, unset others first
      if (updatePayload.is_primary === true) {
        const { data: existing } = await sb.from(TABLE).select('agency_id').eq('id', id).maybeSingle();
        if (existing?.agency_id) await ensureSinglePrimary(sb, existing.agency_id, id);
      }

      const { data: row, error } = await sb.from(TABLE).update(updatePayload).eq('id', id).select().single();
      if (error) throw error;
      const [mapped] = await rowsWithAgentEmail(sb, [row]);
      return Response.json(mapped);
    }

    if (operation === 'delete') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      // If deleting primary, promote the next office (lowest display_order) to primary.
      const { data: target } = await sb.from(TABLE).select('agency_id,is_primary').eq('id', id).maybeSingle();
      const { error } = await sb.from(TABLE).delete().eq('id', id);
      if (error) throw error;

      if (target?.is_primary && target?.agency_id) {
        const { data: next } = await sb.from(TABLE).select('id')
          .eq('agency_id', target.agency_id)
          .order('display_order', { ascending: true })
          .limit(1);
        if (next?.[0]?.id) {
          await sb.from(TABLE).update({ is_primary: true }).eq('id', next[0].id);
        }
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});