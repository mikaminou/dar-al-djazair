import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Agency CRM search profiles. Owned by an agency (profiles.id) and tied to
// an agency_clients row. Optional alerts route to the agency's email,
// mentioning the client's name.
//
// Frontend keeps using `agent_email` and `client_name` for backwards
// compat — we resolve agent_email -> agency_id on writes and derive both on
// reads via joins.

const TABLE = 'client_search_profiles';
const ALLOWED_FIELDS = ['client_id', 'name', 'filters', 'alert_enabled', 'last_checked'];

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

function mapRow(row, agentEmail, clientName) {
  if (!row) return null;
  return {
    id: row.id,
    client_id: row.client_id,
    client_name: clientName || null,
    agent_email: agentEmail || null,
    name: row.name,
    filters: row.filters || {},
    alert_enabled: row.alert_enabled || false,
    last_checked: row.last_checked,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: agentEmail || null,
  };
}

async function rowsWithJoins(sb, rows) {
  if (!rows || rows.length === 0) return [];
  const agencyIds = [...new Set(rows.map(r => r.agency_id).filter(Boolean))];
  const clientIds = [...new Set(rows.map(r => r.client_id).filter(Boolean))];
  const [profsRes, clientsRes] = await Promise.all([
    agencyIds.length ? sb.from('profiles').select('id,email').in('id', agencyIds) : Promise.resolve({ data: [] }),
    clientIds.length ? sb.from('agency_clients').select('id,full_name').in('id', clientIds) : Promise.resolve({ data: [] }),
  ]);
  const idToEmail = Object.fromEntries((profsRes.data || []).map(p => [p.id, p.email]));
  const idToName = Object.fromEntries((clientsRes.data || []).map(c => [c.id, c.full_name]));
  return rows.map(r => mapRow(r, idToEmail[r.agency_id], idToName[r.client_id]));
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
          } else if (k === 'client_id' || k === 'agency_id' || k === 'id' || k === 'alert_enabled') {
            q = q.eq(k, v);
          }
        }
      }
      if (sort) {
        const desc = sort.startsWith('-');
        q = q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
      } else q = q.order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data: rows, error } = await q;
      if (error) throw error;
      return Response.json(await rowsWithJoins(sb, rows));
    }

    if (operation === 'get') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      const [mapped] = await rowsWithJoins(sb, row ? [row] : []);
      return Response.json(mapped || null);
    }

    if (operation === 'create') {
      const agencyEmail = data?.agent_email || user.email;
      const agencyId = await resolveAgencyId(sb, agencyEmail);
      if (!agencyId) return Response.json({ error: 'Agency profile not found' }, { status: 400 });
      const insert = { ...pickFields(data || {}), agency_id: agencyId };
      if (!insert.client_id) return Response.json({ error: 'client_id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).insert(insert).select().single();
      if (error) throw error;
      const [mapped] = await rowsWithJoins(sb, [row]);
      return Response.json(mapped);
    }

    if (operation === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).update(pickFields(data || {})).eq('id', id).select().single();
      if (error) throw error;
      const [mapped] = await rowsWithJoins(sb, [row]);
      return Response.json(mapped);
    }

    if (operation === 'delete') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { error } = await sb.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});