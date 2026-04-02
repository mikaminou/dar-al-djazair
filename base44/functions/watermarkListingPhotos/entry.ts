/**
 * Watermarks all photos in a listing by drawing "DAR EL DJAZAIR" and
 * "dar-el-djazair.com" in the bottom-right corner, then re-uploads and
 * replaces the URLs on the listing record.
 *
 * Called internally by approveListing on action=approve.
 * Returns { watermarked: string[], failed: number[], adminNote: string|null }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Jimp from 'npm:jimp@0.22.12';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { listing_id } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400 });

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const listing = listings[0];
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    const images = listing.images || [];
    if (images.length === 0) return Response.json({ watermarked: [], failed: [], adminNote: null });

    // Load built-in Jimp fonts (bitmap, no system fonts needed)
    const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontSmallWhite = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const fontSmallBlack = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

    const LINE1 = "DAR EL DJAZAIR";
    const LINE2 = "dar-el-djazair.com";
    const PADDING = 16;
    const SHADOW_OFFSET = 2;

    const watermarked = [...images];
    const failed = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const url = images[i];

        // Fetch image bytes
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const buffer = await resp.arrayBuffer();

        const img = await Jimp.read(Buffer.from(buffer));
        const w = img.bitmap.width;
        const h = img.bitmap.height;

        // Choose font size based on image width
        const useLargeFont = w >= 800;
        const font1W = useLargeFont ? fontWhite : fontSmallWhite;
        const font1B = useLargeFont ? fontBlack : fontSmallBlack;
        const font2W = fontSmallWhite;
        const font2B = fontSmallBlack;

        const line1W = Jimp.measureText(font1W, LINE1);
        const line1H = Jimp.measureTextHeight(font1W, LINE1, line1W);
        const line2W = Jimp.measureText(font2W, LINE2);
        const line2H = Jimp.measureTextHeight(font2W, LINE2, line2W);

        const gap = 4;
        const blockH = line1H + gap + line2H;

        // Bottom-right position
        const x1 = w - line1W - PADDING;
        const y1 = h - blockH - PADDING;
        const x2 = w - line2W - PADDING;
        const y2 = y1 + line1H + gap;

        // Print shadow (black offset) then white text on top
        img
          .print(font1B, x1 + SHADOW_OFFSET, y1 + SHADOW_OFFSET, LINE1)
          .print(font1W, x1, y1, LINE1)
          .print(font2B, x2 + SHADOW_OFFSET, y2 + SHADOW_OFFSET, LINE2)
          .print(font2W, x2, y2, LINE2);

        // Export to JPEG buffer
        const outBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
        const file = new File([outBuffer], `listing_${listing_id}_${i}.jpg`, { type: "image/jpeg" });

        // Upload via base44
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        watermarked[i] = file_url;
      } catch (err) {
        console.error(`Watermark failed for image ${i}:`, err.message);
        failed.push(i);
        // keep original URL in watermarked[i] (no change)
      }
    }

    // Update listing with watermarked URLs
    await base44.asServiceRole.entities.Listing.update(listing_id, { images: watermarked });

    const adminNote = failed.length > 0
      ? `Watermarking failed on photo(s) ${failed.map(n => n + 1).join(", ")} — originals kept.`
      : null;

    return Response.json({ watermarked, failed, adminNote });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});