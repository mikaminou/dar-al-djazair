// listingDelete — delete a listing (cascades photos/videos via FK).
// Payload: { id: string }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    let sbUrl = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const sb = createClient(sbUrl, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });

    const { data: existing } = await sb
      .from('listings').select('owner_id').eq('id', id).maybeSingle();
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin') {
      const { data: prof } = await sb.from('profiles').select('id').eq('email', user.email).maybeSingle();
      if (!prof || prof.id !== existing.owner_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { error } = await sb.from('listings').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});