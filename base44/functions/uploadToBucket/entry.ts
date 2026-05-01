/**
 * uploadToBucket — uploads a file to a specific Supabase Storage bucket.
 *
 * Payload:
 *   {
 *     bucket: string,           // one of ALLOWED_BUCKETS
 *     filename: string,         // original name; used to derive extension
 *     content_type: string,     // MIME type
 *     data_base64: string,      // raw base64 (no data: prefix)
 *     prefix?: string,          // optional folder, e.g. "user_<id>"
 *   }
 *
 * Returns:
 *   { url, path, bucket }       // url = public CDN URL (or signed URL for private buckets)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { Buffer } from 'node:buffer';

// Buckets we accept uploads for. Anything else is rejected.
const ALLOWED_BUCKETS = new Set([
  'listing-photos',
  'listing-videos',
  'watermarked-photos',
  'watermarked-videos',
  'profile-avatars',
  'documents',
  'receipts',
]);

// Buckets that should return a time-limited signed URL instead of public URL.
const PRIVATE_BUCKETS = new Set(['documents']);

function getSupabase() {
  const url = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });
}

function extFromName(name, contentType) {
  const m = (name || '').match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase();
  if (contentType?.includes('jpeg')) return 'jpg';
  if (contentType?.includes('png'))  return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('pdf'))  return 'pdf';
  if (contentType?.includes('mp4'))  return 'mp4';
  return 'bin';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { bucket, filename, content_type, data_base64, prefix } = await req.json();
    if (!bucket || !data_base64) {
      return Response.json({ error: 'bucket and data_base64 are required' }, { status: 400 });
    }
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return Response.json({ error: `Bucket '${bucket}' is not allowed` }, { status: 400 });
    }

    const buf = Buffer.from(data_base64, 'base64');
    const ext = extFromName(filename, content_type);
    const safePrefix = (prefix || `user_${user.id || 'anon'}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${safePrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const sb = getSupabase();
    const { error: upErr } = await sb.storage.from(bucket).upload(path, buf, {
      contentType: content_type || 'application/octet-stream',
      upsert: false,
    });
    if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

    let url;
    if (PRIVATE_BUCKETS.has(bucket)) {
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
      if (error) return Response.json({ error: error.message }, { status: 500 });
      url = data.signedUrl;
    } else {
      const { data } = sb.storage.from(bucket).getPublicUrl(path);
      url = data.publicUrl;
    }

    return Response.json({ url, path, bucket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});