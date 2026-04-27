import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { listing_id, manual_caption, scheduled_at, selected_platforms } = body ?? {};
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceClient();
    const { data: listing } = await supabase
      .from("listings")
      .select("id, title, description, price, wilaya, commune, listing_type, property_type, attributes")
      .eq("id", listing_id).single();
    if (!listing) {
      return new Response(JSON.stringify({ error: "listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: photos } = await supabase
      .from("listing_photos").select("watermarked_url, url, position")
      .eq("listing_id", listing_id).order("position", { ascending: true });
    const photoUrls = (photos ?? []).map((p) => p.watermarked_url ?? p.url);

    const platforms = selected_platforms ?? ["facebook", "instagram"];
    const webhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "MAKE_WEBHOOK_URL not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const platform of platforms) {
      await supabase.from("social_posts").insert({
        listing_id, platform, status: "pending",
      });
    }

    const payload = {
      listing, photos: photoUrls, manual_caption, scheduled_at, platforms,
      callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-post-status-callback`,
      callback_secret: Deno.env.get("SOCIAL_POST_CALLBACK_SECRET"),
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});