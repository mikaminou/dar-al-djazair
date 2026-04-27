import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { tenant_payment_id } = await req.json();
    const supabase = getServiceClient();

    const { data: payment } = await supabase
      .from("tenant_payments")
      .select("*, tenants:tenant_id ( full_name, listing_id, landlord_id )")
      .eq("id", tenant_payment_id).single();

    if (!payment) {
      return new Response(JSON.stringify({ error: "payment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("وصل / Receipt", 20, 20);
    doc.setFontSize(11);
    doc.text(`Tenant: ${payment.tenants?.full_name ?? ""}`, 20, 35);
    doc.text(`Amount: ${payment.amount} DZD`, 20, 45);
    doc.text(`Period: ${payment.period_start} → ${payment.period_end}`, 20, 55);
    doc.text(`Payment date: ${payment.payment_date}`, 20, 65);
    doc.text(`Reference: ${payment.id}`, 20, 75);

    const pdfBytes = doc.output("arraybuffer");
    const path = `${payment.tenants?.landlord_id}/${tenant_payment_id}.pdf`;

    const upload = await supabase.storage.from("receipts").upload(
      path, new Uint8Array(pdfBytes),
      { contentType: "application/pdf", upsert: true },
    );
    if (upload.error) throw upload.error;

    const { data: signed } = await supabase.storage
      .from("receipts").createSignedUrl(path, 3600);

    await supabase.from("tenant_payments")
      .update({ receipt_url: signed?.signedUrl })
      .eq("id", tenant_payment_id);

    return new Response(JSON.stringify({ url: signed?.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});