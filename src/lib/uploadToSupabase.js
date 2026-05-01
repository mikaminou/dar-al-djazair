import { base44 } from '@/api/base44Client';

/**
 * Read a File/Blob as a base64 string (no data: prefix).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = reader.result || '';
      const i = String(str).indexOf(',');
      resolve(i >= 0 ? String(str).slice(i + 1) : String(str));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a single File/Blob to a Supabase Storage bucket.
 *
 * @param {File|Blob}            file
 * @param {string}               bucket   one of: listing-photos | listing-videos |
 *                                        watermarked-photos | watermarked-videos |
 *                                        profile-avatars | documents | receipts
 * @param {{ prefix?: string }}  [opts]   optional folder inside the bucket
 * @returns {Promise<{ url: string, path: string, bucket: string }>}
 */
export async function uploadToSupabase(file, bucket, opts = {}) {
  const data_base64 = await fileToBase64(file);
  const res = await base44.functions.invoke('uploadToBucket', {
    bucket,
    filename: file.name || 'upload',
    content_type: file.type || 'application/octet-stream',
    data_base64,
    prefix: opts.prefix,
  });
  const data = res?.data || res;
  if (!data || data.error) throw new Error(data?.error || 'Upload failed');
  return data;
}