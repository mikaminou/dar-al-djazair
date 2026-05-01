/**
 * watermarkListingPhotos (Supabase-backed)
 *
 * Applies owner-based watermarks to all photos of a listing.
 * Watermark type is resolved from the owner's profile:
 *   - If owner has avatar → image watermark (bottom-right, 12% size)
 *   - If no avatar → text watermark with owner display name
 *
 * Reads from `listings` + `listing_photos` tables.
 * Writes watermarked URLs to `listing_photos.watermarked_url`.
 * Sets listing status to "active" and stores any admin note inside `attributes` JSONB.
 *
 * Called by approveListing (action=approve) and by the admin Retry button.
 *
 * Payload: { listing_id: string, retry?: boolean }
 * Returns: { watermarked: string[], failed: Array<{index, reason}>, videoSkipped: boolean, adminNote: string|null }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { Buffer } from 'node:buffer';
import Jimp from 'npm:jimp@0.22.12';

// ── CONFIG ────────────────────────────────────────────────────────────────
const WM = {
  marginRatio: 0.03,
  image: { sizeRatio: 0.12, opacity: 165 },   // opacity 0-255
  text:  { shadowOffset: 2 },
};

function getSupabase() {
  const url = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });
}

// ── WATERMARK CONFIG RESOLVER ─────────────────────────────────────────────
function resolveWatermarkConfig(ownerProfile) {
  if (ownerProfile?.avatar) {
    return { type: "image", source: ownerProfile.avatar };
  }
  const name = ownerProfile?.agency_name || ownerProfile?.full_name || ownerProfile?.email || "Dar El Djazair";
  return { type: "text", content: name };
}

// ── IMAGE WATERMARK ───────────────────────────────────────────────────────
async function applyImageWatermark(img, sourceUrl, w, h, shorter, margin) {
  const size = Math.round(shorter * WM.image.sizeRatio);
  const resp = await fetch(sourceUrl);
  if (!resp.ok) throw new Error(`Watermark avatar fetch failed (${resp.status})`);
  const buf = await resp.arrayBuffer();
  const wm = await Jimp.read(Buffer.from(buf));
  wm.resize(size, Jimp.AUTO);
  const x = w - wm.bitmap.width - margin;
  const y = h - wm.bitmap.height - margin;
  img.composite(wm, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: WM.image.opacity / 255,
    opacityDest: 1,
  });
}

// ── TEXT WATERMARK ────────────────────────────────────────────────────────
async function applyTextWatermark(img, text, w, h, shorter, margin) {
  const useLarge = shorter >= 400;
  const [fontWhite, fontBlack] = await Promise.all([
    Jimp.loadFont(useLarge ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_16_WHITE),
    Jimp.loadFont(useLarge ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_16_BLACK),
  ]);
  const textW = Jimp.measureText(fontWhite, text);
  const textH = Jimp.measureTextHeight(fontWhite, text, textW);
  const x = w - textW - margin;
  const y = h - textH - margin;
  const so = WM.text.shadowOffset;
  img
    .print(fontBlack, x + so, y + so, text)
    .print(fontWhite, x, y, text);
}

// ── PROCESS ONE IMAGE ─────────────────────────────────────────────────────
async function processImage(url, wmConfig, uploadFn, filename) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Image fetch failed (${resp.status}): ${url}`);
  const buffer = await resp.arrayBuffer();
  const img = await Jimp.read(Buffer.from(buffer));
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const shorter = Math.min(w, h);
  const margin = Math.round(shorter * WM.marginRatio);

  if (wmConfig.type === "image") {
    await applyImageWatermark(img, wmConfig.source, w, h, shorter, margin);
  } else {
    await applyTextWatermark(img, wmConfig.content, w, h, shorter, margin);
  }

  const outBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
  const file = new File([outBuffer], filename, { type: "image/jpeg" });
  const { file_url } = await uploadFn(file);
  return file_url;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Require an authenticated user. Admin gating is enforced by callers
    // (approveListing and the admin Retry UI), and server-to-server invokes
    // from those callers don't always forward role info.
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { listing_id, retry } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400 });

    const sb = getSupabase();

    // Fetch listing + photos from Supabase
    const { data: listing, error: listErr } = await sb
      .from('listings')
      .select('id, owner_id, attributes, listing_photos(id, url, watermarked_url, position)')
      .eq('id', listing_id)
      .maybeSingle();
    if (listErr) return Response.json({ error: listErr.message }, { status: 500 });
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // Fetch any video (separate table)
    const { data: videos } = await sb
      .from('listing_videos')
      .select('id, url')
      .eq('listing_id', listing_id);
    const videoUrl = videos?.[0]?.url || null;

    // Sort photos by position; in retry mode skip those already watermarked
    const photos = (listing.listing_photos || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .filter(p => !!p.url)
      .filter(p => retry ? !p.watermarked_url : true);

    if (photos.length === 0 && !videoUrl) {
      return Response.json({ watermarked: [], failed: [], videoSkipped: false, adminNote: null });
    }

    // Resolve owner profile from Supabase profiles
    const { data: ownerProfile } = await sb
      .from('profiles')
      .select('email, full_name, agency_name, avatar')
      .eq('id', listing.owner_id)
      .maybeSingle();
    const wmConfig = resolveWatermarkConfig(ownerProfile);

    const uploadFn = async (file) =>
      base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Process all photos
    const watermarked = [];
    const failed = [];

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      try {
        const newUrl = await processImage(
          p.url,
          wmConfig,
          uploadFn,
          `listing_${listing_id}_${i}.jpg`
        );
        const { error: updErr } = await sb
          .from('listing_photos')
          .update({ watermarked_url: newUrl })
          .eq('id', p.id);
        if (updErr) throw updErr;
        watermarked.push(newUrl);
      } catch (err) {
        console.error(`Watermark failed for photo ${i}:`, err.message);
        failed.push({ index: i, reason: err.message });
        // Keep original URL — fail gracefully
      }
    }

    // Video: server-side processing not available — skip gracefully
    let videoSkipped = false;
    if (videoUrl) {
      videoSkipped = true;
      console.warn("Video watermarking skipped: FFmpeg not available in this environment.");
    }

    // Build admin note for any failures
    const failedNotes = failed.map(f => `Photo ${f.index + 1} (${f.reason})`);
    if (videoSkipped) failedNotes.push("Video (server-side video watermarking not supported — original kept)");
    const adminNote = failedNotes.length > 0
      ? `Watermark issues: ${failedNotes.join("; ")}`
      : null;

    // Update listing: status → active, store admin_note + active_since in attributes JSONB
    const attributes = { ...(listing.attributes || {}) };
    if (adminNote) attributes.admin_note = adminNote;
    if (!attributes.active_since) attributes.active_since = new Date().toISOString();

    const { error: finalErr } = await sb
      .from('listings')
      .update({ status: 'active', attributes, updated_at: new Date().toISOString() })
      .eq('id', listing_id);
    if (finalErr) throw finalErr;

    return Response.json({ watermarked, failed, videoSkipped, adminNote });
  } catch (error) {
    console.error("watermarkListingPhotos fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});