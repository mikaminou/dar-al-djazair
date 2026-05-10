import { supabase } from '@/lib/supabaseClient';

// Buckets that require a signed URL (private)
const PRIVATE_BUCKETS = new Set(['documents', 'receipts']);

function extFromFile(file) {
  const m = (file.name || '').match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase();
  const ct = file.type || '';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('png'))  return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('pdf'))  return 'pdf';
  if (ct.includes('mp4'))  return 'mp4';
  return 'bin';
}

/**
 * Upload a single File/Blob to a Supabase Storage bucket.
 *
 * The path is always prefixed with the authenticated user's UUID so that
 * the storage RLS policy (foldername[1] = auth.uid()) is satisfied.
 *
 * @param {File|Blob}            file
 * @param {string}               bucket   e.g. 'listing-photos', 'profile-avatars'
 * @param {{ prefix?: string }}  [opts]   optional sub-folder inside the bucket
 * @returns {Promise<{ url: string, path: string, bucket: string }>}
 */
export async function uploadToSupabase(file, bucket = 'listing-photos', opts = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated to upload files');

  const ext = extFromFile(file);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const subFolder = opts.prefix ? `${opts.prefix}/` : '';
  const storagePath = `${user.id}/${subFolder}${ts}_${rand}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });

  if (uploadError) throw uploadError;

  if (PRIVATE_BUCKETS.has(bucket)) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days
    if (error) throw error;
    return { url: data.signedUrl, path: storagePath, bucket };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return { url: data.publicUrl, path: storagePath, bucket };
}
