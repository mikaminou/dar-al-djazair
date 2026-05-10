/**
 * uploadToBucket — upload a file to a Supabase Storage bucket. Requires auth.
 *
 * Payload:
 *   { bucket: string, filename: string, content_type: string,
 *     data_base64: string, prefix?: string }
 *
 * Returns: { url, path, bucket }
 *
 * Note: Direct client-side uploads (via supabase-js) are now preferred.
 * This function is retained for cases where server-side processing is needed
 * (e.g., from other edge functions).
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser } from "../_shared/supabaseAdmin.ts";
import { Buffer } from "node:buffer";

const ALLOWED_BUCKETS = new Set([
  "listing-photos", "listing-videos", "watermarked-photos",
  "watermarked-videos", "profile-avatars", "documents", "receipts",
]);
const PRIVATE_BUCKETS = new Set(["documents", "receipts"]);

function extFromName(name: string, contentType: string) {
  const m = (name ?? "").match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase();
  if (contentType?.includes("jpeg")) return "jpg";
  if (contentType?.includes("png"))  return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("pdf"))  return "pdf";
  if (contentType?.includes("mp4"))  return "mp4";
  return "bin";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });

    const { bucket, filename, content_type, data_base64, prefix } = await req.json();
    if (!bucket || !data_base64) {
      return Response.json({ error: "bucket and data_base64 are required" }, { status: 400, headers: corsHeaders });
    }
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return Response.json({ error: `Bucket '${bucket}' is not allowed` }, { status: 400, headers: corsHeaders });
    }

    const buf = Buffer.from(data_base64, "base64");
    const ext = extFromName(filename ?? "", content_type ?? "");
    const safePrefix = (prefix ?? `${authUser.id}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `${safePrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const sb = getServiceClient();
    const { error: upErr } = await sb.storage.from(bucket).upload(path, buf, {
      contentType: content_type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) return Response.json({ error: upErr.message }, { status: 500, headers: corsHeaders });

    let url: string;
    if (PRIVATE_BUCKETS.has(bucket)) {
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
      if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
      url = data.signedUrl;
    } else {
      const { data } = sb.storage.from(bucket).getPublicUrl(path);
      url = data.publicUrl;
    }

    return Response.json({ url, path, bucket }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
