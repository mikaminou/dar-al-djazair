/**
 * watermarkListingPhotos
 *
 * Applies owner-based watermarks to all images of a listing.
 * Watermark type is resolved from the owner's profile:
 *   - If owner has avatar → image watermark (bottom-right, 12% size, 65% opacity)
 *   - If no avatar → text watermark with owner display name
 *
 * Also handles a "retry" mode for failed assets.
 *
 * Called by approveListing (action=approve) and by the admin Retry button.
 *
 * Payload: { listing_id: string, retry?: boolean }
 * Returns: { watermarked: string[], failed: Array<{index, reason}>, videoSkipped: boolean, adminNote: string|null }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Jimp from 'npm:jimp@0.22.12';

// ── CONFIG ────────────────────────────────────────────────────────────────
const WM = {
  marginRatio: 0.03,
  image: { sizeRatio: 0.12, opacity: 165 },   // opacity 0-255
  text:  { shadowOffset: 2 },
};

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
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { listing_id, retry } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400 });

    // Fetch listing
    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const listing = listings[0];
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    const images = listing.images || [];
    const videoUrl = listing.video_url || null;

    if (images.length === 0 && !videoUrl) {
      return Response.json({ watermarked: [], failed: [], videoSkipped: false, adminNote: null });
    }

    // Fetch owner profile for watermark config
    const ownerEmail = listing.created_by;
    const ownerUsers = await base44.asServiceRole.entities.User.filter({ email: ownerEmail }, null, 1).catch(() => []);
    const ownerProfile = ownerUsers[0] || null;
    const wmConfig = resolveWatermarkConfig(ownerProfile);

    const uploadFn = async (file) =>
      base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Process all images
    const watermarked = [...images];
    const failed = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const newUrl = await processImage(
          images[i],
          wmConfig,
          uploadFn,
          `listing_${listing_id}_${i}.jpg`
        );
        watermarked[i] = newUrl;
      } catch (err) {
        console.error(`Watermark failed for image ${i}:`, err.message);
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

    // Update listing with watermarked image URLs, then set to active
    const updatePayload = { images: watermarked, status: "active" };
    // Only set active_since if not already set (first approval)
    if (!listing.active_since) {
      updatePayload.active_since = new Date().toISOString();
    }
    // Build watermark admin note
    const failedNotes = failed.map(f => `Photo ${f.index + 1} (${f.reason})`);
    if (videoSkipped) failedNotes.push("Video (server-side video watermarking not supported — original kept)");
    const adminNote = failedNotes.length > 0
      ? `Watermark issues: ${failedNotes.join("; ")}`
      : null;
    if (adminNote) {
      updatePayload.admin_note = adminNote;
    }

    await base44.asServiceRole.entities.Listing.update(listing_id, updatePayload);

    return Response.json({ watermarked, failed, videoSkipped, adminNote });
  } catch (error) {
    console.error("watermarkListingPhotos fatal error:", error.message);
    // On fatal failure, still set listing to active so it's not stuck
    try {
      const base44 = createClientFromRequest(req);
      // We can't re-parse req body here, but listing_id may not be accessible
      // The approveListing function handles fallback activation
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});