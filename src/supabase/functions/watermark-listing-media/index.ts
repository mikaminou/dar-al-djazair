// Stub: copies original URL into watermarked_url. Replace with a real
// pipeline that fetches each photo, applies a watermark, and uploads
// to the watermarked-* bucket.

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceClient();
    await supabase.from("listings").update({ watermark_status: "pending" }).eq("id", listing_id);

    const { data: photos } = await supabase
      .from("listing_photos").select("id, url").eq("listing_id", listing_id);
    for (const p of photos ?? []) {
      await supabase.from("listing_photos")
        .update({ watermarked_url: p.url }).eq("id", p.id);
    }

    const { data: videos } = await supabase
      .from("listing_videos").select("id, url").eq("listing_id", listing_id);
    for (const v of videos ?? []) {
      await supabase.from("listing_videos")
        .update({ watermarked_url: v.url }).eq("id", v.id);
    }

    await supabase.from("listings").update({ watermark_status: "done" }).eq("id", listing_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});