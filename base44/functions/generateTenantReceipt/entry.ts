import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      tenant_name, landlord_name, landlord_email,
      property_address, amount, period_start, period_end,
      payment_date, reference_number
    } = payload;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ── Colors ──
    const EMERALD = [5, 150, 105];
    const DARK = [15, 52, 38];
    const GRAY = [100, 110, 115];
    const LIGHT_BG = [240, 253, 247];
    const WHITE = [255, 255, 255];

    // ── Header band ──
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 38, 'F');

    // Logo circle
    doc.setFillColor(...EMERALD);
    doc.circle(20, 19, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text('DAR', 20, 17, { align: 'center' });
    doc.text('ALG', 20, 22, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...WHITE);
    doc.text('RECU DE PAIEMENT', 36, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 220, 200);
    doc.text('Rent Payment Receipt  |  Dar Al Djazair', 36, 24);

    // Reference badge (top right)
    doc.setFillColor(...EMERALD);
    doc.roundedRect(W - 65, 8, 57, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text('REFERENCE', W - 36.5, 15, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(reference_number, W - 36.5, 22, { align: 'center' });

    // ── Main content area ──
    let y = 50;

    // Date row
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, W - 28, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text('DATE DE PAIEMENT', 20, y + 2.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const payDate = new Date(payment_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(payDate, W - 20, y + 2.5, { align: 'right' });
    y += 18;

    // ── Two-column info cards ──
    const cardH = 42;
    const cardW = (W - 34) / 2;

    // Landlord card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(...EMERALD);
    doc.setLineWidth(0.6);
    doc.line(14, y, 14, y + cardH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text('PROPRIETAIRE', 20, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(landlord_name || landlord_email, 20, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(landlord_email, 20, y + 26);

    // Tenant card
    const cx = 14 + cardW + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(...EMERALD);
    doc.line(cx, y, cx, y + cardH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text('LOCATAIRE', cx + 6, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(tenant_name, cx + 6, y + 18);

    y += cardH + 12;

    // Property row
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, W - 28, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...EMERALD);
    doc.text('PROPRIETE', 20, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const addrLines = doc.splitTextToSize(property_address, W - 60);
    doc.text(addrLines, 20, y + 7);
    y += 24;

    // ── Period section ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('PERIODE COUVERTE', 14, y);
    y += 6;

    const startFmt = new Date(period_start).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const endFmt = new Date(period_end).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, y + 1, W - 14, y + 1);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(`Du   ${startFmt}`, 20, y);
    y += 6;
    doc.text(`au   ${endFmt}`, 20, y);
    y += 14;

    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, W - 14, y);
    y += 12;

    // ── Amount highlight box ──
    doc.setFillColor(...DARK);
    doc.roundedRect(14, y, W - 28, 22, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT_BG);
    doc.text('MONTANT PAYE', 24, y + 9);

    const amountStr = new Intl.NumberFormat('fr-FR').format(amount) + ' DA';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(110, 231, 183); // emerald-300
    doc.text(amountStr, W - 20, y + 14, { align: 'right' });

    y += 34;

    // ── Stamp / verification area ──
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y, W - 28, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('Ce recu constitue une preuve de paiement valide.', W / 2, y + 7, { align: 'center' });
    doc.text('Conservez ce document pour vos archives.', W / 2, y + 13, { align: 'center' });

    // ── Footer ──
    doc.setFillColor(...DARK);
    doc.rect(0, H - 14, W, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 220, 200);
    doc.text('Dar Al Djazair  |  Plateforme Immobiliere Algerienne', W / 2, H - 8, { align: 'center' });
    doc.setTextColor(100, 160, 130);
    doc.text(reference_number, W - 14, H - 8, { align: 'right' });

    const pdfBase64 = doc.output('datauristring');
    return Response.json({ pdf_base64: pdfBase64, reference: reference_number });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});