/**
 * generateTenantReceipt — generate a rent payment receipt PDF. Requires auth.
 * Payload: { tenant_name, landlord_name, landlord_email, property_address,
 *            amount, period_start, period_end, payment_date, reference_number }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser } from "../_shared/supabaseAdmin.ts";
import { jsPDF } from "npm:jspdf@4.0.0";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const {
      tenant_name, landlord_name, landlord_email,
      property_address, amount, period_start, period_end,
      payment_date, reference_number,
    } = await req.json();

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const EMERALD: [number, number, number] = [5, 150, 105];
    const DARK: [number, number, number] = [15, 52, 38];
    const GRAY: [number, number, number] = [100, 110, 115];
    const LIGHT_BG: [number, number, number] = [240, 253, 247];
    const WHITE: [number, number, number] = [255, 255, 255];

    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 38, "F");

    doc.setFillColor(...EMERALD);
    doc.circle(20, 19, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text("DAR", 20, 17, { align: "center" });
    doc.text("ALG", 20, 22, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...WHITE);
    doc.text("RECU DE PAIEMENT", 36, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 220, 200);
    doc.text("Rent Payment Receipt  |  Dar Al Djazair", 36, 24);

    doc.setFillColor(...EMERALD);
    doc.roundedRect(W - 65, 8, 57, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text("REFERENCE", W - 36.5, 15, { align: "center" });
    doc.setFontSize(8.5);
    doc.text(reference_number ?? "", W - 36.5, 22, { align: "center" });

    let y = 50;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, W - 28, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text("DATE DE PAIEMENT", 20, y + 2.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const payDate = new Date(payment_date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    doc.text(payDate, W - 20, y + 2.5, { align: "right" });
    y += 18;

    const cardH = 42;
    const cardW = (W - 34) / 2;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, cardW, cardH, 3, 3, "F");
    doc.setDrawColor(...EMERALD);
    doc.setLineWidth(0.6);
    doc.line(14, y, 14, y + cardH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text("PROPRIETAIRE", 20, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(landlord_name || landlord_email, 20, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(landlord_email, 20, y + 26);

    const cx = 14 + cardW + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, cardH, 3, 3, "F");
    doc.setDrawColor(...EMERALD);
    doc.line(cx, y, cx, y + cardH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text("LOCATAIRE", cx + 6, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(tenant_name, cx + 6, y + 18);
    y += cardH + 12;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, W - 28, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text("PROPRIETE", 20, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const addrLines = doc.splitTextToSize(property_address, W - 60);
    doc.text(addrLines, 20, y + 7);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("PERIODE COUVERTE", 14, y);
    y += 6;

    const startFmt = new Date(period_start).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
    const endFmt = new Date(period_end).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, y + 1, W - 14, y + 1);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(`Du   ${startFmt}`, 20, y);
    y += 6;
    doc.text(`au   ${endFmt}`, 20, y);
    y += 14;

    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, W - 14, y);
    y += 12;

    doc.setFillColor(...DARK);
    doc.roundedRect(14, y, W - 28, 22, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT_BG);
    doc.text("MONTANT PAYE", 24, y + 9);
    const amountStr = new Intl.NumberFormat("fr-FR").format(amount) + " DA";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(110, 231, 183);
    doc.text(amountStr, W - 20, y + 14, { align: "right" });
    y += 34;

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y, W - 28, 18, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text("Ce recu constitue une preuve de paiement valide.", W / 2, y + 7, { align: "center" });
    doc.text("Conservez ce document pour vos archives.", W / 2, y + 13, { align: "center" });

    doc.setFillColor(...DARK);
    doc.rect(0, H - 14, W, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 220, 200);
    doc.text("Dar Al Djazair  |  Plateforme Immobiliere Algerienne", W / 2, H - 8, { align: "center" });
    doc.setTextColor(100, 160, 130);
    doc.text(reference_number ?? "", W - 14, H - 8, { align: "right" });

    const pdfBase64 = doc.output("datauristring");

    let pdf_url: string | null = null;
    try {
      const sb = getServiceClient();
      const arrayBuffer = doc.output("arraybuffer");
      const safeLandlord = (landlord_email || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `${safeLandlord}/${reference_number ?? Date.now()}.pdf`;
      const { error: upErr } = await sb.storage.from("receipts").upload(path, new Uint8Array(arrayBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!upErr) {
        const { data } = await sb.storage.from("receipts").createSignedUrl(path, 60 * 60 * 24 * 30);
        pdf_url = data?.signedUrl ?? null;
      }
    } catch (e: unknown) {
      console.warn("Receipt bucket upload failed:", (e as Error).message);
    }

    return Response.json({ pdf_base64: pdfBase64, pdf_url, reference: reference_number }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
