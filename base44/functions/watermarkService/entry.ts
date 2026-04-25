/**
 * Watermark Service — all watermarking logic lives here.
 *
 * Public interface:
 *   resolveWatermarkConfig(ownerProfile) → { type: "image", source: url } | { type: "text", content: name }
 *   applyWatermarkToImage(imageUrl, watermarkConfig, uploadFn) → watermarked image URL
 *   applyWatermarkToVideo(videoUrl, watermarkConfig) → original URL (video watermarking not supported server-side)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Jimp from 'npm:jimp@0.22.12';

// ── CONFIG (inline — watermark.config.js cannot be imported as a module) ──
const WM = {
  marginRatio: 0.03,
  image: { sizeRatio: 0.12, opacity: 165 },
  text:  { fontSizeRatio: 0.03, shadowOffset: 2, opacity: 178 },
};

// ── PUBLIC API ────────────────────────────────────────────────────────────

/**
 * Resolves which watermark to use based on owner profile.
 * @param {object} ownerProfile - User entity record
 * @returns {{ type: "image", source: string } | { type: "text", content: string }}
 */
export function resolveWatermarkConfig(ownerProfile) {
  if (ownerProfile?.avatar) {
    return { type: "image", source: ownerProfile.avatar };
  }
  const name = ownerProfile?.agency_name || ownerProfile?.full_name || ownerProfile?.email || "Dar El Djazair";
  return { type: "text", content: name };
}

/**
 * Applies a watermark to a single image URL.
 * @param {string} imageUrl
 * @param {{ type: string, source?: string, content?: string }} wmConfig
 * @param {Function} uploadFn - async (File) => { file_url: string }
 * @param {string} filename - name for the uploaded file
 * @returns {Promise<string>} watermarked image URL
 */
export async function applyWatermarkToImage(imageUrl, wmConfig, uploadFn, filename) {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Fetch failed (${resp.status}): ${imageUrl}`);
  const buffer = await resp.arrayBuffer();

  const img = await Jimp.read(Buffer.from(buffer));
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const shorter = Math.min(w, h);
  const margin = Math.round(shorter * WM.marginRatio);

  if (wmConfig.type === "image") {
    await _applyImageWatermark(img, wmConfig.source, w, h, shorter, margin);
  } else {
    await _applyTextWatermark(img, wmConfig.content, w, h, shorter, margin);
  }

  const outBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
  const file = new File([outBuffer], filename || "watermarked.jpg", { type: "image/jpeg" });
  const { file_url } = await uploadFn(file);
  return file_url;
}

/**
 * Video watermarking — server-side video processing not feasible in Deno.
 * Returns the original URL unchanged (graceful no-op).
 */
export async function applyWatermarkToVideo(videoUrl, _wmConfig) {
  // Server-side video watermarking requires FFmpeg which is unavailable in this environment.
  // Return original; admin is notified separately.
  return { url: videoUrl, skipped: true };
}

// ── PRIVATE HELPERS ───────────────────────────────────────────────────────

async function _applyImageWatermark(img, sourceUrl, w, h, shorter, margin) {
  const size = Math.round(shorter * WM.image.sizeRatio);
  const resp = await fetch(sourceUrl);
  if (!resp.ok) throw new Error(`Watermark image fetch failed (${resp.status})`);
  const buf = await resp.arrayBuffer();

  const wm = await Jimp.read(Buffer.from(buf));
  wm.resize(size, Jimp.AUTO);
  wm.opacity(WM.image.opacity / 255);

  const x = w - wm.bitmap.width - margin;
  const y = h - wm.bitmap.height - margin;
  img.composite(wm, x, y, { mode: Jimp.BLEND_SOURCE_OVER, opacitySource: WM.image.opacity / 255 });
}

async function _applyTextWatermark(img, text, w, h, shorter, margin) {
  const so = WM.text.shadowOffset;

  // Pick best available font size
  const useLarge = shorter >= 400;
  const [fontWhite, fontBlack] = await Promise.all([
    Jimp.loadFont(useLarge ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_16_WHITE),
    Jimp.loadFont(useLarge ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_16_BLACK),
  ]);

  const textW = Jimp.measureText(fontWhite, text);
  const textH = Jimp.measureTextHeight(fontWhite, text, textW);

  const x = w - textW - margin;
  const y = h - textH - margin;

  // Shadow first, then white text on top
  img
    .print(fontBlack, x + so, y + so, text)
    .print(fontWhite, x, y, text);
}

// ── DENO SERVE (this file is also callable as a standalone function) ──────
Deno.serve(async (req) => {
  return Response.json({ error: "Use watermarkListingPhotos instead." }, { status: 400 });
});