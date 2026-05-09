/**
 * watermarkListingPhotos — apply watermarks to all listing photos.
 * Payload: { listing_id: string, retry?: boolean }
 *
 * Replaces the old base44-SDK-authenticated version with Supabase JWT auth.
 * All Supabase storage and DB access uses the service role key.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser } from "../_shared/supabaseAdmin.ts";
import { Buffer } from "node:buffer";
import Jimp from "npm:jimp@0.22.12";

const WM = {
  marginRatio: 0.03,
  image: { sizeRatio: 0.12, opacity: 165 },
  text: { shadowOffset: 2 },
};

const APP_LOGO_URL =
  "https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png";

function resolveWatermarkConfig(ownerProfile: any) {
  const source = ownerProfile?.avatar_url || APP_LOGO_URL;
  const fullName = [ownerProfile?.first_name, ownerProfile?.last_name]
    .filter(Boolean).join(" ").trim();
  const fallbackText =
    ownerProfile?.agency_name || fullName || ownerProfile?.email || "Dar El Djazair";
  return { type: "image", source, fallbackText };
}

async function applyImageWatermark(img: any, sourceUrl: string, w: number, h: number, shorter: number, margin: number) {
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

async function applyTextWatermark(img: any, text: string, w: number, h: number, shorter: number, margin: number) {
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
  img.print(fontBlack, x + so, y + so, text).print(fontWhite, x, y, text);
}

async function processImage(url: string, wmConfig: any, sb: any, listingId: string, index: number) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Image fetch failed (${resp.status}): ${url}`);
  const buffer = await resp.arrayBuffer();
  const img = await Jimp.read(Buffer.from(buffer));
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const shorter = Math.min(w, h);
  const margin = Math.round(shorter * WM.marginRatio);

  if (wmConfig.type === "image") {
    try {
      await applyImageWatermark(img, wmConfig.source, w, h, shorter, margin);
    } catch {
      await applyTextWatermark(img, wmConfig.fallbackText, w, h, shorter, margin);
    }
  } else {
    await applyTextWatermark(img, wmConfig.content, w, h, shorter, margin);
  }

  const outBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
  const path = `listing_${listingId}/${Date.now()}_${index}.jpg`;
  const { error: upErr } = await sb.storage.from("watermarked-photos").upload(path, outBuffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) throw new Error(`Watermarked upload failed: ${upErr.message}`);
  const { data } = sb.storage.from("watermarked-photos").getPublicUrl(path);
  return data.publicUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });

    const { listing_id, retry } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400, headers: corsHeaders });

    const sb = getServiceClient();

    const { data: listing, error: listErr } = await sb
      .from("listings")
      .select("id, owner_id, active_since, listing_photos(id, url, watermarked_url, position)")
      .eq("id", listing_id)
      .maybeSingle();
    if (listErr) return Response.json({ error: listErr.message }, { status: 500, headers: corsHeaders });
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404, headers: corsHeaders });

    const { data: videos } = await sb.from("listing_videos").select("id, url").eq("listing_id", listing_id);
    const videoUrl = (videos as any[])?.[0]?.url ?? null;

    const photos = ((listing.listing_photos as any[]) ?? [])
      .slice()
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .filter((p: any) => !!p.url)
      .filter((p: any) => retry ? !p.watermarked_url : true);

    if (photos.length === 0 && !videoUrl) {
      return Response.json({ watermarked: [], failed: [], videoSkipped: false, adminNote: null }, { headers: corsHeaders });
    }

    const { data: ownerProfile } = await sb
      .from("profiles")
      .select("email, first_name, last_name, agency_name, avatar_url")
      .eq("id", listing.owner_id)
      .maybeSingle();

    const wmConfig = resolveWatermarkConfig(ownerProfile);
    const watermarked: string[] = [];
    const failed: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i] as any;
      try {
        const newUrl = await processImage(p.url, wmConfig, sb, listing_id, i);
        await sb.from("listing_photos").update({ watermarked_url: newUrl }).eq("id", p.id);
        watermarked.push(newUrl);
      } catch (err: unknown) {
        failed.push({ index: i, reason: (err as Error).message });
      }
    }

    let videoSkipped = false;
    if (videoUrl) videoSkipped = true;

    const failedNotes = failed.map((f) => `Photo ${f.index + 1} (${f.reason})`);
    if (videoSkipped) failedNotes.push("Video (server-side video watermarking not supported)");
    const adminNote = failedNotes.length > 0 ? `Watermark issues: ${failedNotes.join("; ")}` : null;

    const updateRow: any = { status: "active", admin_note: adminNote, updated_at: new Date().toISOString() };
    if (!listing.active_since) updateRow.active_since = new Date().toISOString();

    await sb.from("listings").update(updateRow).eq("id", listing_id);
    return Response.json({ watermarked, failed, videoSkipped, adminNote }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
