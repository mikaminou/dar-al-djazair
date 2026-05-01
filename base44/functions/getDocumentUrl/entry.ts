import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

/**
 * Admin-only function to generate a temporary signed URL for a private verification document.
 *
 * Accepts:
 *   { file_uri }   — storage path inside the `documents` Supabase bucket (new flow)
 *                  — or a legacy Base44 file URI (handled via Core.CreateFileSignedUrl)
 */
function getSupabase() {
  const url = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { file_uri } = await req.json();
    if (!file_uri) return Response.json({ error: "Missing file_uri" }, { status: 400 });

    // Legacy Base44 URIs
    if (file_uri.startsWith('base44://') || file_uri.includes('base44.com')) {
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 300,
      });
      return Response.json({ signed_url: result.signed_url });
    }

    // New flow: file_uri is a path inside the `documents` Supabase bucket
    const sb = getSupabase();
    const { data, error } = await sb.storage.from('documents').createSignedUrl(file_uri, 300);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ signed_url: data.signedUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});