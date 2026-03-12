import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { payment_id, tenant_name, landlord_email, landlord_name, property_address, amount, period_start, period_end, payment_date, reference_number } = payload;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('وصل الإيجار / Receipt', pageWidth / 2, y, { align: 'center' });
    
    y += 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Reçu de Paiement de Loyer', pageWidth / 2, y, { align: 'center' });

    y += 15;
    doc.setDrawColor(16, 185, 129);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // Reference Number
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Reference:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(reference_number, 60, y);

    y += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, y);
    doc.setFont(undefined, 'normal');
    const paymentDateFormatted = new Date(payment_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(paymentDateFormatted, 60, y);

    y += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // From Section
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Du propriétaire:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y += 6;
    doc.text(landlord_name, 25, y);
    y += 6;
    doc.text(landlord_email, 25, y);

    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Au locataire:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y += 6;
    doc.text(tenant_name, 25, y);

    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Propriété:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y += 6;
    doc.text(property_address, 25, y, { maxWidth: 160 });

    y += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    // Payment Details
    const startFormatted = new Date(period_start).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const endFormatted = new Date(period_end).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(10);
    doc.text('Période couverte:', 20, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`Du ${startFormatted}`, 25, y);
    y += 5;
    doc.text(`au ${endFormatted}`, 25, y);

    y += 12;
    doc.setFont(undefined, 'bold');
    doc.text('Montant payé:', 20, y);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(`${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`, pageWidth - 40, y, { align: 'right' });

    y += 20;
    doc.setDrawColor(16, 185, 129);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Ceci est un reçu numérique. Pour plus d\'informations, contactez le propriétaire.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Generate PDF and upload
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Create a FormData to upload
    const formData = new FormData();
    formData.append('file', blob, `receipt-${reference_number}.pdf`);

    // Upload to private storage
    const uploadRes = await base44.integrations.Core.UploadFile({ file: blob });
    
    return Response.json({ url: uploadRes.file_url, reference: reference_number });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});