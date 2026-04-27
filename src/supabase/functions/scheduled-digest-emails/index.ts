import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getServiceClient();
  const { data: searches } = await supabase
    .from("saved_searches").select("*").eq("notify_email", true);

  let processed = 0;
  for (const s of searches ?? []) {
    let q = supabase.from("listings").select("id, title, wilaya, price").eq("status", "active");
    const f = s.filters ?? {};
    if (f.listing_type)  q = q.eq("listing_type", f.listing_type);
    if (f.property_type) q = q.eq("property_type", f.property_type);
    if (f.wilaya)        q = q.eq("wilaya", f.wilaya);
    if (f.min_price)     q = q.gte("price", f.min_price);
    if (f.max_price)     q = q.lte("price", f.max_price);
    if (s.last_match_at) q = q.gt("created_at", s.last_match_at);

    const { data: matches } = await q.limit(20);
    if (!matches || matches.length === 0) continue;

    const { data: profile } = await supabase
      .from("profiles").select("email").eq("id", s.user_id).maybeSingle();
    if (!profile?.email) continue;

    await supabase.from("notifications").insert({
      user_email: profile.email,
      type: "saved_search_digest",
      title: `${matches.length} new match${matches.length === 1 ? "" : "es"}`,
      body: matches.slice(0, 3).map((m) => m.title).join(" · "),
      url: `/Listings`,
      ref_id: `digest_${s.id}_${Date.now()}`,
    });
    await supabase.from("saved_searches")
      .update({ last_match_at: new Date().toISOString() }).eq("id", s.id);
    processed++;
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});