import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const TABLE = 'typing_status';
const ALLOWED_FIELDS = ['thread_id', 'typer_email', 'typed_at'];

function getSupabase() {
  let url = Deno.env.get('supabase_base_url') || '';
  url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), {
    auth: { persistSession: false },
  });
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    thread_id: row.thread_id,
    typer_email: row.typer_email,
    typed_at: row.typed_at,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: row.typer_email,
  };
}

function pickFields(payload) {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (payload[k] !== undefined) out[k] = payload[k];
  return out;
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
      if (query) for (const [k, v] of Object.entries(query)) q = q.eq(k, v);
      if (sort) {
        const desc = sort.startsWith('-');
        q = q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
      } else q = q.order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data: rows, error } = await q;
      if (error) throw error;
      return Response.json(rows.map(mapRow));
    }

    if (operation === 'get') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return Response.json(mapRow(row));
    }

    if (operation === 'create') {
      const insert = { ...pickFields(data || {}), typer_email: data?.typer_email || user.email };
      const { data: row, error } = await sb.from(TABLE).insert(insert).select().single();
      if (error) throw error;
      return Response.json(mapRow(row));
    }

    if (operation === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const { data: row, error } = await sb.from(TABLE).update(pickFields(data || {})).eq('id', id).select().single();
      if (error) throw error;
      return Response.json(mapRow(row));
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