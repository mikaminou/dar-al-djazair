import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async () => {
  const supabase = getServiceClient();
  const cutoff = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const { data: tenants } = await supabase
    .from("tenants").select("id, full_name, end_date, landlord_id")
    .eq("status", "active").lte("end_date", cutoff);

  let count = 0;
  for (const t of tenants ?? []) {
    const { data: landlord } = await supabase
      .from("profiles").select("email").eq("id", t.landlord_id).maybeSingle();
    if (!landlord?.email) continue;

    await supabase.from("notifications").insert({
      user_email: landlord.email,
      type: "tenant_renewal",
      title: `Lease ending soon: ${t.full_name}`,
      body: `Ends ${t.end_date}`,
      url: `/TenantManagement`,
      ref_id: `renewal_${t.id}_${t.end_date}`,
    });
    count++;
  }

  return new Response(JSON.stringify({ ok: true, count }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});