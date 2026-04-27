import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = req.headers.get("x-callback-secret");
  if (secret !== Deno.env.get("SOCIAL_POST_CALLBACK_SECRET")) {
    return new Response("unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { listing_id, platform, status, post_url, error_message,
            facebook_post_id, instagram_media_id } = body ?? {};

    const supabase = getServiceClient();
    const { data: row } = await supabase
      .from("social_posts").select("id")
      .eq("listing_id", listing_id).eq("platform", platform).eq("status", "pending")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (row) {
      await supabase.from("social_posts").update({
        status, post_url, error_message,
        posted_at: status === "success" ? new Date().toISOString() : null,
        facebook_post_id, instagram_media_id,
      }).eq("id", row.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});