import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { getFieldsForType, getPropertyType } from "@/components/propertyTypes.config";
import { resolveAttributes, formatAttributeValue } from "@/utils/listingAttributes";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPriceDZD(n, lang = "fr") {
  if (!n) return "—";
  const DA = lang === "ar" ? "دج" : "DA";
  if (n >= 1_000_000_000) {
    const b = Math.floor(n / 1_000_000_000);
    const m = Math.round((n % 1_000_000_000) / 1_000_000);
    return lang === "ar" ? `${b} مليار${m ? ` و ${m} مليون` : ""} ${DA}` : `${b} milliard${b > 1 ? "s" : ""}${m ? ` ${m}M` : ""} ${DA}`;
  }
  if (n >= 1_000_000) {
    const m = Math.round(n / 1_000_000);
    return lang === "ar" ? `${m} مليون ${DA}` : `${m} million${m > 1 ? "s" : ""} ${DA}`;
  }
  const locale = lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-DZ" : "en-GB";
  return `${new Intl.NumberFormat(locale).format(n)} ${DA}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows, headers, filename) {
  const sep = ";";
  const lines = [headers.join(sep), ...rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

// ── Branded PDF builder (via jsPDF) ─────────────────────────────────────────

async function buildBrandedPDF(title, subtitle, drawBody, lang) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Dar El Djazair  ·  dar-el-djazair.com", 14, 11);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 24);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 32);
  }

  // Body
  doc.setTextColor(30, 30, 30);
  const bottomY = drawBody(doc, 46, W, H);

  // Footer
  const footerY = H - 12;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY - 3, W - 14, footerY - 3);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("© Dar El Djazair  ·  dar-el-djazair.com", 14, footerY + 2);
  doc.text(new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB"), W - 14, footerY + 2, { align: "right" });

  return doc;
}

// ── LISTINGS ─────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  pending: { fr: "En attente", en: "Pending", ar: "انتظار" },
  active: { fr: "Actif", en: "Active", ar: "نشط" },
  reserved: { fr: "Réservé", en: "Reserved", ar: "محجوز" },
  sold: { fr: "Vendu", en: "Sold", ar: "مباع" },
  rented: { fr: "Loué", en: "Rented", ar: "مؤجر" },
  archived: { fr: "Archivé", en: "Archived", ar: "مؤرشف" },
  deleted: { fr: "Supprimé", en: "Deleted", ar: "محذوف" },
  declined: { fr: "Refusé", en: "Declined", ar: "مرفوض" },
  changes_requested: { fr: "Modif. requises", en: "Changes Requested", ar: "تعديلات" },
};

async function exportListingsPDF(listings, lang) {
  const L = {
    title: { fr: "Mes Annonces", en: "My Listings", ar: "إعلاناتي" },
    sub: { fr: `${listings.length} annonce(s)`, en: `${listings.length} listing(s)`, ar: `${listings.length} إعلان` },
  };
  const t = k => L[k][lang] || L[k].fr;

  const doc = await buildBrandedPDF(t("title"), t("sub"), (doc, startY, W) => {
    let y = startY;

    listings.forEach((listing, idx) => {
      if (y > 240) { doc.addPage(); y = 20; }

      // ── Universal section ────────────────────────────────────────────────────
      if (idx % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(14, y - 2, W - 28, 10, "F"); }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 95, 70);
      doc.text((listing.title || "").slice(0, 60), 14, y + 5);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);

      const universalRow = [
        `${lang === "fr" ? "Type" : "Type"}: ${(listing.property_type || "").replace(/_/g, " ")}`,
        `${lang === "fr" ? "Opération" : "Type"}: ${listing.listing_type === "sale" ? (lang === "ar" ? "بيع" : "Vente") : (lang === "ar" ? "إيجار" : "Location")}`,
        `Wilaya: ${listing.wilaya || "—"}`,
        `${lang === "fr" ? "Prix" : "Price"}: ${formatPriceDZD(listing.price, lang)}`,
        `${lang === "fr" ? "Statut" : "Status"}: ${STATUS_LABEL[listing.status]?.[lang] || listing.status || "—"}`,
      ].join("   ");
      doc.text(universalRow, 14, y + 4);
      y += 8;

      // ── Dynamic attributes section ───────────────────────────────────────────
      const attrs = resolveAttributes(listing);
      const fields = getFieldsForType(listing.property_type || "");
      const attrParts = [];
      for (const field of fields) {
        const raw = attrs[field.key];
        if (raw === null || raw === undefined || raw === "") continue;
        const formatted = formatAttributeValue(raw, field, lang);
        if (!formatted) continue;
        const label = field.label[lang] || field.label.fr || field.key;
        attrParts.push(`${label}: ${formatted}`);
      }
      if (attrParts.length > 0) {
        doc.setTextColor(50, 50, 50);
        // Wrap into lines of ~100 chars
        const attrLine = attrParts.join("  ·  ");
        const wrapped = doc.splitTextToSize(attrLine, W - 28);
        wrapped.forEach(line => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 14, y + 4);
          y += 6;
        });
      }

      y += 4; // gap between listings
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y, W - 14, y);
      y += 4;
    });
    return y;
  }, lang);

  doc.save(`listings_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportListingsCSV(listings, lang) {
  // Universal columns
  const universalKeys = ["id", "title", "property_type", "listing_type", "wilaya", "commune", "price", "status", "created_date"];
  const universalHeaders = {
    id: "id", title: "title", property_type: "property_type", listing_type: "listing_type",
    wilaya: "wilaya", commune: "commune", price: "price_DZD", status: "status", created_date: "created_date",
  };

  // Collect union of all dynamic field keys across all listings
  const dynamicKeySet = new Set();
  const fieldDefMap = {}; // key → fieldDef (from first type that defines it)
  for (const listing of listings) {
    const fields = getFieldsForType(listing.property_type || "");
    for (const f of fields) {
      dynamicKeySet.add(f.key);
      if (!fieldDefMap[f.key]) fieldDefMap[f.key] = f;
    }
  }
  const dynamicKeys = [...dynamicKeySet];

  // Build headers row
  const headers = [
    ...universalKeys.map(k => universalHeaders[k]),
    ...dynamicKeys.map(k => {
      const fd = fieldDefMap[k];
      const unit = fd?.unit ? `_${fd.unit.replace(/[^a-z0-9]/gi, "")}` : "";
      return `${k}${unit}`;
    }),
  ];

  // Build data rows
  const rows = listings.map(listing => {
    const attrs = resolveAttributes(listing);
    const universalCells = universalKeys.map(k => {
      if (k === "status") return STATUS_LABEL[listing.status]?.[lang] || listing.status || "";
      if (k === "created_date") return listing.created_date ? new Date(listing.created_date).toLocaleDateString() : "";
      return listing[k] ?? "";
    });
    const dynamicCells = dynamicKeys.map(k => {
      const fd = fieldDefMap[k];
      // Only populate if this field exists for this listing's property type
      const typeFields = getFieldsForType(listing.property_type || "");
      const fieldExistsForType = typeFields.some(f => f.key === k);
      if (!fieldExistsForType) return "";
      const raw = attrs[k];
      if (raw === null || raw === undefined || raw === "") return "";
      if (fd) return formatAttributeValue(raw, fd, lang) ?? raw;
      return raw;
    });
    return [...universalCells, ...dynamicCells];
  });

  downloadCSV(rows, headers, `listings_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────

async function exportAnalyticsPDF(data, period, lang) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const el = document.getElementById("analytics-dashboard-content");
  if (!el) return;

  const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#f9fafb" });
  const imgData = canvas.toDataURL("image/png");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Dar El Djazair  ·  dar-el-djazair.com", 14, 11);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = lang === "ar" ? "لوحة التحليلات" : lang === "fr" ? "Tableau de Bord Analytique" : "Analytics Dashboard";
  doc.text(title, 14, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const sub = `${period === "weekly" ? (lang === "fr" ? "Vue hebdomadaire" : "Weekly view") : (lang === "fr" ? "Vue mensuelle" : "Monthly view")}  ·  ${new Date().toLocaleDateString()}`;
  doc.text(sub, 14, 32);

  // Render screenshot across pages
  const imgW = W - 20;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pageContentH = H - 50; // 38 header + 12 footer
  let remaining = imgH;
  let srcY = 0;
  let firstPage = true;

  while (remaining > 0) {
    if (!firstPage) doc.addPage();
    const sliceH = Math.min(remaining, firstPage ? pageContentH : H - 20);
    const srcSliceH = (sliceH / imgH) * canvas.height;

    // Crop the canvas slice
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcSliceH;
    const ctx = sliceCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);
    const sliceData = sliceCanvas.toDataURL("image/png");

    const yOffset = firstPage ? 42 : 10;
    doc.addImage(sliceData, "PNG", 10, yOffset, imgW, sliceH);
    srcY += srcSliceH;
    remaining -= sliceH;
    firstPage = false;
  }

  // Footer on last page
  const footerY = H - 10;
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("© Dar El Djazair  ·  dar-el-djazair.com", 14, footerY);

  doc.save(`analytics_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportAnalyticsCSV(data, period, lang) {
  const H = {
    fr: ["Date", "Métrique", "Valeur"],
    en: ["Date", "Metric", "Value"],
    ar: ["التاريخ", "المقياس", "القيمة"],
  };
  const rows = [];

  const leadLabel = { fr: "Lead", en: "Lead", ar: "عميل محتمل" };
  const msgLabel = { fr: "Message reçu", en: "Message received", ar: "رسالة مستلمة" };
  const apptLabel = { fr: "RDV", en: "Appointment", ar: "موعد" };
  const viewLabel = { fr: "Vues", en: "Views", ar: "مشاهدات" };

  data.leads?.forEach(l => rows.push([new Date(l.created_date).toLocaleDateString(), leadLabel[lang] || leadLabel.en, l.status]));
  data.receivedMessages?.forEach(m => rows.push([new Date(m.created_date).toLocaleDateString(), msgLabel[lang] || msgLabel.en, 1]));
  data.appointments?.forEach(a => rows.push([a.date || new Date(a.created_date).toLocaleDateString(), apptLabel[lang] || apptLabel.en, a.status]));
  data.listings?.forEach(l => rows.push([new Date(l.created_date).toLocaleDateString(), viewLabel[lang] || viewLabel.en, l.views_count || 0]));

  downloadCSV(rows, H[lang] || H.en, `analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ── RENTAL INCOME DASHBOARD ──────────────────────────────────────────────────

async function exportRentalPDF(data, lang) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const el = document.getElementById("rental-dashboard-content");
  if (!el) return;

  const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#f9fafb" });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Dar El Djazair  ·  dar-el-djazair.com", 14, 11);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = lang === "ar" ? "تقرير دخل الإيجار" : lang === "fr" ? "Rapport de Revenus Locatifs" : "Rental Income Report";
  doc.text(title, 14, 24);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB"), 14, 32);

  const imgW = W - 20;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pageContentH = H - 50;
  let remaining = imgH;
  let srcY = 0;
  let firstPage = true;

  while (remaining > 0) {
    if (!firstPage) doc.addPage();
    const sliceH = Math.min(remaining, firstPage ? pageContentH : H - 20);
    const srcSliceH = (sliceH / imgH) * canvas.height;
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcSliceH;
    sliceCanvas.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);
    doc.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 10, firstPage ? 42 : 10, imgW, sliceH);
    srcY += srcSliceH;
    remaining -= sliceH;
    firstPage = false;
  }

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("© Dar El Djazair  ·  dar-el-djazair.com", 14, H - 10);
  doc.save(`rental_income_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportRentalCSV(data, lang) {
  const H = {
    fr: ["Propriété", "Locataire", "Montant (DZD)", "Début période", "Fin période", "Date paiement", "Référence"],
    en: ["Property", "Tenant", "Amount (DZD)", "Period Start", "Period End", "Payment Date", "Reference"],
    ar: ["العقار", "المستأجر", "المبلغ (دج)", "بداية الفترة", "نهاية الفترة", "تاريخ الدفع", "المرجع"],
  };
  const rows = data.payments?.map(p => {
    const tenant = data.tenants?.find(t => t.id === p.tenant_id);
    return [
      tenant?.property_address || "—",
      tenant?.tenant_name || "—",
      p.amount,
      p.period_start_date,
      p.period_end_date,
      p.payment_date,
      p.reference_number || "—",
    ];
  }) || [];
  downloadCSV(rows, H[lang] || H.fr, `rental_income_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExportButton({ type, listings, filteredListings, data, period, lang }) {
  const [loading, setLoading] = useState(false);

  const L = {
    export:      { fr: "Exporter",          en: "Export",         ar: "تصدير"          },
    pdf_all:     { fr: "PDF — Tout",         en: "PDF — All",      ar: "PDF — الكل"     },
    pdf_filter:  { fr: "PDF — Filtrés",      en: "PDF — Filtered", ar: "PDF — المصفى"   },
    csv_all:     { fr: "CSV — Tout",         en: "CSV — All",      ar: "CSV — الكل"     },
    csv_filter:  { fr: "CSV — Filtrés",      en: "CSV — Filtered", ar: "CSV — المصفى"   },
    pdf:         { fr: "Exporter PDF",       en: "Export PDF",     ar: "تصدير PDF"      },
    csv:         { fr: "Exporter CSV",       en: "Export CSV",     ar: "تصدير CSV"      },
  };
  const t = k => L[k][lang] || L[k].en;

  async function run(fn) {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-2 text-sm" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t("export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {type === "listings" ? (
          <>
            <DropdownMenuItem className="gap-2" onClick={() => run(() => exportListingsPDF(listings, lang))}>
              <FileText className="w-4 h-4 text-red-500" />{t("pdf_all")}
            </DropdownMenuItem>
            {filteredListings && filteredListings.length !== listings.length && (
              <DropdownMenuItem className="gap-2" onClick={() => run(() => exportListingsPDF(filteredListings, lang))}>
                <FileText className="w-4 h-4 text-red-400" />{t("pdf_filter")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => exportListingsCSV(listings, lang)}>
              <Table className="w-4 h-4 text-green-600" />{t("csv_all")}
            </DropdownMenuItem>
            {filteredListings && filteredListings.length !== listings.length && (
              <DropdownMenuItem className="gap-2" onClick={() => exportListingsCSV(filteredListings, lang)}>
                <Table className="w-4 h-4 text-green-500" />{t("csv_filter")}
              </DropdownMenuItem>
            )}
          </>
        ) : (
          <>
            <DropdownMenuItem className="gap-2" onClick={() => run(() => type === "analytics" ? exportAnalyticsPDF(data, period, lang) : exportRentalPDF(data, lang))}>
              <FileText className="w-4 h-4 text-red-500" />{t("pdf")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => type === "analytics" ? exportAnalyticsCSV(data, period, lang) : exportRentalCSV(data, lang)}>
              <Table className="w-4 h-4 text-green-600" />{t("csv")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}