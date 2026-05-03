import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

// Agency CRM contacts (NOT app users). Owned by an agency (profiles.id).
// Frontend keeps using `agent_email` for backwards compatibility — we resolve
// it to `agency_id` (FK to profiles) on writes and derive it on reads.

const TABLE = 'agency_clients';
const ALLOWED_FIELDS = ['full_name', 'phone', 'email', 'notes'];

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
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    agent_email: agentEmail,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: agentEmail,
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
      // Translate legacy agent_email filter -> agency_id
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
      } else q = q.order('created_at', { ascending: false });
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
      const insert = { ...pickFields(data || {}), agency_id: agencyId };
      const { data: row, error } = await sb.from(TABLE).insert(insert).select().single();
      if (error) throw error;
      return Response.json(mapRow(row, agencyEmail));
    }

    if (operation === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).update(pickFields(data || {})).eq('id', id).select().single();
      if (error) throw error;
      const [mapped] = await rowsWithAgentEmail(sb, [row]);
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