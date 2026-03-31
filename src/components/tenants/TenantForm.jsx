import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, FileText, ChevronDown, ChevronUp, Globe } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

export default function TenantForm({ tenant, currentUser, onSave, onCancel, lang }) {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({
    listing_id: "",
    property_address: "",
    tenant_name: "",
    tenant_phone: "",
    rent_amount: "",
    period_type: "monthly",
    period_months: "",
    total_paid_upfront: "",
    period_start_date: "",
    special_conditions: ""
  });
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showContractExtras, setShowContractExtras] = useState(false);
  const [contractExtras, setContractExtras] = useState({
    tenant_id_number: "",
    tenant_address: "",
    deposit: ""
  });
  const [contractLang, setContractLang] = useState(lang || "fr");

  useEffect(() => {
    loadListings();
    if (tenant) {
      setForm({
        listing_id: tenant.listing_id,
        property_address: tenant.property_address,
        tenant_name: tenant.tenant_name,
        tenant_phone: tenant.tenant_phone || "",
        rent_amount: tenant.rent_amount,
        period_type: tenant.period_type,
        period_months: tenant.period_months || "",
        total_paid_upfront: tenant.total_paid_upfront ?? "",
        period_start_date: tenant.period_start_date,
        special_conditions: tenant.special_conditions || ""
      });
    }
  }, [tenant]);

  async function loadListings() {
    const data = await base44.entities.Listing.filter({ created_by: currentUser.email, status: "active" }, "-created_date", 50);
    setListings(data);
  }

  function calculateEndDate(startDate, periodType, periodMonths) {
    const start = startDate || form.period_start_date;
    const ptype = periodType || form.period_type;
    const pmonths = periodMonths || form.period_months;
    if (!start) return "";
    const d = new Date(start + "T00:00:00");
    let months = 1;
    if (ptype === "trimestrial") months = 3;
    else if (ptype === "6months") months = 6;
    else if (ptype === "yearly") months = 12;
    else if (ptype === "custom") months = parseInt(pmonths) || 1;
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.listing_id || !form.tenant_name || !form.rent_amount || !form.period_start_date) return;
    setSaving(true);
    const payload = {
      ...form,
      rent_amount: parseFloat(form.rent_amount),
      total_paid_upfront: form.total_paid_upfront !== "" ? parseFloat(form.total_paid_upfront) : 0,
      period_months: form.period_type === "custom" ? parseInt(form.period_months) : null,
      period_end_date: calculateEndDate()
    };
    await onSave(payload);
    setSaving(false);
  }

  async function handleGeneratePDF() {
    if (!form.tenant_name || !form.period_start_date || !form.rent_amount) return;
    setGeneratingPdf(true);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210; const MARGIN = 20;
    const selectedListing = listings.find(l => l.id === form.listing_id);
    const propertyAddress = [selectedListing?.address, selectedListing?.commune, selectedListing?.wilaya].filter(Boolean).join(", ");
    const localeStr = contractLang === "ar" ? "ar-DZ" : contractLang === "fr" ? "fr-FR" : "en-US";
    const today = new Date().toLocaleDateString(localeStr, { year: "numeric", month: "long", day: "numeric" });
    const agencyName = currentUser?.agency_name || currentUser?.full_name || "";
    const landlordPhone = currentUser?.phone || "";
    const endDate = calculateEndDate();
    const durationMap = { monthly: 1, trimestrial: 3, "6months": 6, yearly: 12, custom: parseInt(form.period_months) || 1 };
    const durationMonths = durationMap[form.period_type] || 1;

    // i18n strings for contract
    const i18n = {
      fr: { bail: "CONTRAT DE LOCATION", bailSub: "Bail à usage d'habitation", bailSub2: "عقد إيجار سكني — Rental Agreement", bailleur: "BAILLEUR (PROPRIÉTAIRE)", locataire: "LOCATAIRE", bien: "BIEN LOUÉ", duree: "DURÉE DU CONTRAT", loyer: "LOYER & PAIEMENT", conditions: "CONDITIONS PARTICULIÈRES", signatures: "SIGNATURES DES PARTIES", dateDebut: "Date de début", dateFin: "Date de fin", dureeLabel: "Durée", loyerLabel: "Loyer", depot: "Dépôt de garantie", avance: "Payé d'avance", mode: "Mode de paiement", modeVal: "D'avance, avant le 5 du mois", adresse: "Adresse", type: "Type", surface: "Surface", pieces: "Pièces", adresseLoc: "Adresse locataire", cin: "CIN", sig: "Signature :", bailleurSig: "Bailleur", locataireSig: "Locataire", footer: "Dar Al Djazair · Plateforme immobilière algérienne", ref: "Réf" },
      ar: { bail: "عقد إيجار", bailSub: "عقد إيجار للاستخدام السكني", bailSub2: "Contrat de Location — Bail résidentiel", bailleur: "المؤجر (صاحب العقار)", locataire: "المستأجر", bien: "العقار المؤجر", duree: "مدة العقد", loyer: "الإيجار والدفع", conditions: "شروط خاصة", signatures: "توقيعات الطرفين", dateDebut: "تاريخ البداية", dateFin: "تاريخ الانتهاء", dureeLabel: "المدة", loyerLabel: "الإيجار", depot: "التأمين", avance: "مدفوع مقدماً", mode: "طريقة الدفع", modeVal: "مقدماً قبل الخامس من كل شهر", adresse: "العنوان", type: "النوع", surface: "المساحة", pieces: "الغرف", adresseLoc: "عنوان المستأجر", cin: "رقم الهوية", sig: "التوقيع :", bailleurSig: "المؤجر", locataireSig: "المستأجر", footer: "دار الجزائر · منصة العقار الجزائرية", ref: "مرجع" },
      en: { bail: "RENTAL AGREEMENT", bailSub: "Residential Lease Agreement", bailSub2: "عقد إيجار سكني — Contrat de Location", bailleur: "LANDLORD (OWNER)", locataire: "TENANT", bien: "LEASED PROPERTY", duree: "CONTRACT DURATION", loyer: "RENT & PAYMENT", conditions: "SPECIAL CONDITIONS", signatures: "PARTIES' SIGNATURES", dateDebut: "Start date", dateFin: "End date", dureeLabel: "Duration", loyerLabel: "Rent", depot: "Security deposit", avance: "Paid upfront", mode: "Payment method", modeVal: "In advance, before the 5th", adresse: "Address", type: "Type", surface: "Area", pieces: "Rooms", adresseLoc: "Tenant address", cin: "ID Number", sig: "Signature:", bailleurSig: "Landlord", locataireSig: "Tenant", footer: "Dar Al Djazair · Algerian Real Estate Platform", ref: "Ref" }
    };
    const T = i18n[contractLang] || i18n.fr;

    // ── Emerald palette ──
    const EMERALD = [5, 150, 105];   // #059669
    const DARK    = [4, 120, 87];    // #047857
    const GOLD    = [180, 140, 20];  // warm gold for Arabic subtitle
    const LIGHT   = [209, 250, 229]; // #d1fae5
    const GRAY    = [107, 114, 128];
    const BLACK   = [17, 24, 39];

    // ── Try to embed logo ──
    let logoDataUrl = null;
    if (currentUser?.avatar_url) {
      try {
        const resp = await fetch(currentUser.avatar_url);
        const blob = await resp.blob();
        logoDataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (_) {}
    }

    // ══════════════════════════════════
    //  PAGE 1 — COVER PAGE
    // ══════════════════════════════════

    // Top mini-header bar (like the screenshot)
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 14, "F");
    doc.setTextColor(209, 250, 229); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text((agencyName || "DAR AL DJAZAIR").toUpperCase(), MARGIN, 9);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(180, 220, 200);
    const miniSubtitle = contractLang === "ar"
      ? "عقد إيجار سكني — Contrat de Location — Rental Agreement"
      : "Contrat de Location — عقد الإيجار — Rental Agreement";
    doc.text(miniSubtitle, MARGIN + 2 + doc.getTextWidth((agencyName || "DAR AL DJAZAIR").toUpperCase()) + 6, 9);
    // Mini logo in top-right
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", W - MARGIN - 8, 1, 10, 10, undefined, "FAST");
    }

    // Thick emerald line below mini-header
    doc.setDrawColor(...EMERALD); doc.setLineWidth(0.8);
    doc.line(MARGIN, 18, W - MARGIN, 18);

    // ── APP BRAND — always "DAR EL DJAZAIR" ──
    doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(36);
    doc.text("DAR EL DJAZAIR", W / 2, 58, { align: "center" });

    // Arabic brand subtitle (gold)
    doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal"); doc.setFontSize(16);
    doc.text("دار الجزائر", W / 2, 70, { align: "center" });

    // Horizontal rule
    doc.setDrawColor(...DARK); doc.setLineWidth(0.5);
    doc.line(MARGIN + 20, 78, W - MARGIN - 20, 78);

    // Contract title in 3 languages
    doc.setTextColor(...BLACK); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("CONTRAT DE LOCATION", W / 2, 91, { align: "center" });
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...GRAY);
    doc.text("Bail à usage d'habitation", W / 2, 100, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text("عقد إيجار سكني  —  Rental Agreement", W / 2, 109, { align: "center" });

    // Gold accent line
    doc.setDrawColor(...GOLD); doc.setLineWidth(2);
    doc.line(MARGIN + 10, 116, W - MARGIN - 10, 116);

    // Agency logo (centered large)
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", W / 2 - 18, 123, 36, 36, undefined, "FAST");
    } else {
      doc.setDrawColor(...EMERALD); doc.setLineWidth(0.5);
      doc.circle(W / 2, 141, 18, "S");
      doc.setTextColor(...EMERALD); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
      doc.text((agencyName[0] || "D").toUpperCase(), W / 2, 146, { align: "center" });
    }

    // Ref + date
    doc.setFillColor(...LIGHT);
    doc.roundedRect(MARGIN + 20, 168, W - MARGIN * 2 - 40, 18, 2, 2, "F");
    doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(`${T.ref}: ${Date.now().toString(36).toUpperCase()}`, W / 2, 175, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY); doc.setFontSize(8);
    doc.text(today, W / 2, 181, { align: "center" });

    // Wilaya
    if (selectedListing?.wilaya) {
      doc.setTextColor(...GRAY); doc.setFontSize(8);
      doc.text(selectedListing.wilaya, W / 2, 192, { align: "center" });
    }

    // ── FOOTER on cover ──
    doc.setFillColor(...DARK);
    doc.rect(0, 285, W, 12, "F");
    doc.setTextColor(209, 250, 229); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.text(T.footer, W / 2, 292, { align: "center" });

    // ══ PAGE 2 — CONTRACT BODY ══
    doc.addPage();

    // Slim header on body pages
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 12, "F");
    doc.setTextColor(209, 250, 229); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.text((agencyName || "DAR AL DJAZAIR").toUpperCase(), MARGIN, 8);
    doc.setFont("helvetica", "normal"); doc.setTextColor(180, 220, 200);
    doc.text(T.bail, W - MARGIN, 8, { align: "right" });

    let y = 22;

    // ── Section helper ──
    const section = (title, icon = "") => {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFillColor(...LIGHT);
      doc.roundedRect(MARGIN, y - 5, W - MARGIN * 2, 9, 1.5, 1.5, "F");
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${icon}  ${title}`.trim(), MARGIN + 4, y + 1);
      y += 10;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      doc.setTextColor(...BLACK);
    };

    const row = (label, value, highlight = false) => {
      if (!value) return;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.text(label, MARGIN + 4, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      doc.setTextColor(highlight ? EMERALD[0] : BLACK[0], highlight ? EMERALD[1] : BLACK[1], highlight ? EMERALD[2] : BLACK[2]);
      if (highlight) doc.setFont("helvetica", "bold");
      doc.text(String(value), MARGIN + 60, y);
      doc.setTextColor(...BLACK); doc.setFont("helvetica", "normal");
      // Subtle rule
      doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2);
      doc.line(MARGIN + 4, y + 2, W - MARGIN - 4, y + 2);
      y += 8;
    };

    // ── PARTIES CARDS (with logo in Bailleur card) ──
    const cardH = 40;
    // Bailleur card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(MARGIN, y, 82, cardH, 2, 2, "F");
    doc.setDrawColor(...EMERALD); doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, y, 82, cardH, 2, 2, "S");
    // Label tag
    doc.setFillColor(...EMERALD);
    doc.roundedRect(MARGIN, y, 82, 9, 2, 2, "F");
    doc.rect(MARGIN, y + 5, 82, 4, "F"); // square bottom corners
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.text(T.bailleur, MARGIN + 4, y + 6.5);
    // Logo thumbnail inside card
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", MARGIN + 60, y + 12, 16, 16, undefined, "FAST");
    }
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...DARK);
    doc.text(agencyName || "—", MARGIN + 4, y + 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRAY);
    if (landlordPhone) doc.text(landlordPhone, MARGIN + 4, y + 25);
    if (currentUser?.email) doc.text(currentUser.email, MARGIN + 4, y + 32);

    // Locataire card
    const cx = W - MARGIN - 82;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, 82, cardH, 2, 2, "F");
    doc.setDrawColor(...DARK); doc.setLineWidth(0.5);
    doc.roundedRect(cx, y, 82, cardH, 2, 2, "S");
    doc.setFillColor(...DARK);
    doc.roundedRect(cx, y, 82, 9, 2, 2, "F");
    doc.rect(cx, y + 5, 82, 4, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.text(T.locataire, cx + 4, y + 6.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...DARK);
    doc.text(form.tenant_name, cx + 4, y + 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRAY);
    if (form.tenant_phone) doc.text(form.tenant_phone, cx + 4, y + 25);
    if (contractExtras.tenant_id_number) doc.text(`${T.cin}: ${contractExtras.tenant_id_number}`, cx + 4, y + 32);
    y += cardH + 10;

    // ── ARTICLE 2: BIEN LOUÉ ──
    section(T.bien);
    row(T.adresse, propertyAddress);
    if (selectedListing?.property_type) row(T.type, selectedListing.property_type);
    if (selectedListing?.area) row(T.surface, `${selectedListing.area} m²`);
    if (selectedListing?.rooms) row(T.pieces, String(selectedListing.rooms));
    y += 3;

    // ── ARTICLE 3: DURÉE ──
    section(T.duree);
    row(T.dateDebut, form.period_start_date);
    row(T.dureeLabel, `${durationMonths} mois`);
    row(T.dateFin, endDate);
    y += 3;

    // ── ARTICLE 4: LOYER ──
    section(T.loyer);
    row(T.loyerLabel, `${Number(form.rent_amount).toLocaleString("fr-DZ")} DZD`, true);
    if (contractExtras.deposit) row(T.depot, `${Number(contractExtras.deposit).toLocaleString("fr-DZ")} DZD`);
    if (form.total_paid_upfront) row(T.avance, `${Number(form.total_paid_upfront).toLocaleString("fr-DZ")} DZD`);
    row(T.mode, T.modeVal);
    y += 3;

    // ── ARTICLE 5: CONDITIONS ──
    if (form.special_conditions || contractExtras.tenant_address) {
      section(T.conditions);
      if (contractExtras.tenant_address) row(T.adresseLoc, contractExtras.tenant_address);
      if (form.special_conditions) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...GRAY);
        const lines = doc.splitTextToSize(form.special_conditions, W - MARGIN * 2 - 8);
        doc.text(lines, MARGIN + 4, y);
        y += lines.length * 6 + 4;
      }
      y += 3;
    }

    // ── SIGNATURES SECTION ──
    if (y > 220) { doc.addPage(); y = 20; }
    y += 6;
    section(T.signatures);
    y += 4;

    const sigBoxW = 82; const sigBoxH = 35;
    // Bailleur sig box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(MARGIN, y, sigBoxW, sigBoxH, 2, 2, "F");
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, sigBoxW, sigBoxH, 2, 2, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text(T.bailleurSig, MARGIN + 4, y + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.text(agencyName, MARGIN + 4, y + 13);
    doc.text(T.sig, MARGIN + 4, y + 26);
    doc.setDrawColor(...EMERALD); doc.line(MARGIN + 22, y + 26, MARGIN + sigBoxW - 4, y + 26);

    // Locataire sig box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(W - MARGIN - sigBoxW, y, sigBoxW, sigBoxH, 2, 2, "F");
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(W - MARGIN - sigBoxW, y, sigBoxW, sigBoxH, 2, 2, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text(T.locataireSig, W - MARGIN - sigBoxW + 4, y + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.text(form.tenant_name, W - MARGIN - sigBoxW + 4, y + 13);
    doc.text(T.sig, W - MARGIN - sigBoxW + 4, y + 26);
    doc.setDrawColor(...EMERALD); doc.line(W - MARGIN - sigBoxW + 22, y + 26, W - MARGIN - 4, y + 26);
    y += sigBoxH + 10;

    // ── FOOTER on all body pages ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...DARK);
      doc.rect(0, 285, W, 12, "F");
      doc.setTextColor(209, 250, 229); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
      doc.text(T.footer, W / 2, 292, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.text(`Page ${i} / ${pageCount}`, W - MARGIN, 292, { align: "right" });
    }

    doc.save(`contrat-${form.tenant_name.replace(/\s+/g, "-")}.pdf`);
    setGeneratingPdf(false);
  }

  const selectedListing = listings.find(l => l.id === form.listing_id);
  const endDate = calculateEndDate();
  const periodLabel = lang === "ar"
    ? { monthly: "شهري", trimestrial: "ثلاثي", "6months": "6 أشهر", yearly: "سنوي", custom: "مخصص" }[form.period_type]
    : lang === "fr"
    ? { monthly: "Mensuel", trimestrial: "Trimestriel", "6months": "6 mois", yearly: "Annuel", custom: "Personnalisé" }[form.period_type]
    : { monthly: "Monthly", trimestrial: "Trimestrial", "6months": "6 Months", yearly: "Yearly", custom: "Custom" }[form.period_type];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {tenant
            ? (lang === "ar" ? "تعديل المستأجر" : lang === "fr" ? "Modifier le locataire" : "Edit Tenant")
            : (lang === "ar" ? "إضافة مستأجر جديد" : lang === "fr" ? "Nouveau locataire" : "New Tenant")}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* REQUIRED FIELDS SECTION */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {lang === "ar" ? "المعلومات الأساسية" : lang === "fr" ? "Informations requises" : "Required Information"}
        </p>

        {/* Property */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {lang === "ar" ? "العقار" : lang === "fr" ? "Propriété" : "Property"} *
          </label>
          <Select value={form.listing_id} onValueChange={v => {
            const l = listings.find(x => x.id === v);
            set("listing_id", v);
            set("property_address", l?.address || l?.title || "");
          }}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder={lang === "ar" ? "اختر العقار" : lang === "fr" ? "Choisir un bien" : "Select property"} />
            </SelectTrigger>
            <SelectContent>
              {listings.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.title} {l.commune ? `— ${l.commune}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tenant Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {lang === "ar" ? "اسم المستأجر" : lang === "fr" ? "Nom du locataire" : "Tenant Name"} *
          </label>
          <Input value={form.tenant_name} onChange={e => set("tenant_name", e.target.value)} required
            placeholder={lang === "ar" ? "الاسم الكامل" : lang === "fr" ? "Nom complet" : "Full name"} className="border-gray-200" />
        </div>

        {/* Start Date + Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {lang === "ar" ? "تاريخ البداية" : lang === "fr" ? "Date de début" : "Start Date"} *
            </label>
            <DatePicker value={form.period_start_date} onChange={v => set("period_start_date", v)} lang={lang} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {lang === "ar" ? "مدة الدفع" : lang === "fr" ? "Période" : "Period"} *
            </label>
            <Select value={form.period_type} onValueChange={v => set("period_type", v)}>
              <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{lang === "ar" ? "شهري" : lang === "fr" ? "Mensuel" : "Monthly"}</SelectItem>
                <SelectItem value="trimestrial">{lang === "ar" ? "ثلاثي" : lang === "fr" ? "Trimestriel" : "Trimestrial"}</SelectItem>
                <SelectItem value="6months">{lang === "ar" ? "6 أشهر" : lang === "fr" ? "6 mois" : "6 Months"}</SelectItem>
                <SelectItem value="yearly">{lang === "ar" ? "سنوي" : lang === "fr" ? "Annuel" : "Yearly"}</SelectItem>
                <SelectItem value="custom">{lang === "ar" ? "مخصص" : lang === "fr" ? "Personnalisé" : "Custom"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {form.period_type === "custom" && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {lang === "ar" ? "عدد الأشهر" : lang === "fr" ? "Nombre de mois" : "Number of Months"} *
            </label>
            <Input type="number" min="1" value={form.period_months} onChange={e => set("period_months", e.target.value)} className="border-gray-200" required />
          </div>
        )}

        {/* Auto end date badge */}
        {endDate && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700">
            <span className="font-medium">{lang === "ar" ? "تاريخ الانتهاء:" : lang === "fr" ? "Fin de période :" : "Period ends:"}</span>
            <span>{new Date(endDate + "T00:00:00").toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        )}

        {/* Rent Amount */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {lang === "ar" ? "مبلغ الإيجار (دج)" : lang === "fr" ? "Loyer (DA)" : "Rent Amount (DA)"} *
          </label>
          <Input type="number" value={form.rent_amount} onChange={e => set("rent_amount", e.target.value)} required className="border-gray-200" />
        </div>
      </div>

      {/* OPTIONAL FIELDS */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">
          {lang === "ar" ? "معلومات اختيارية" : lang === "fr" ? "Informations optionnelles" : "Optional Details"}
        </p>

        {/* Phone + Downpayment */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}
            </label>
            <Input value={form.tenant_phone} onChange={e => set("tenant_phone", e.target.value)} placeholder="+213 ..." className="border-gray-200" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              {lang === "ar" ? "المبلغ المدفوع مقدماً (دج)" : lang === "fr" ? "Payé d'avance (DA)" : "Paid Upfront (DA)"}
            </label>
            <Input type="number" value={form.total_paid_upfront} onChange={e => set("total_paid_upfront", e.target.value)}
              placeholder="0" className="border-gray-200" />
          </div>
        </div>

        {/* Special Conditions */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {lang === "ar" ? "شروط خاصة" : lang === "fr" ? "Conditions spéciales" : "Special Conditions"}
          </label>
          <Textarea value={form.special_conditions} onChange={e => set("special_conditions", e.target.value)} rows={2} className="border-gray-200 resize-none" />
        </div>
      </div>

      {/* CONTRACT PDF SECTION */}
      <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setShowContractExtras(!showContractExtras)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            {lang === "ar" ? "إنشاء عقد PDF" : lang === "fr" ? "Générer un contrat PDF" : "Generate PDF Contract"}
          </span>
          {showContractExtras ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showContractExtras && (
          <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
            <p className="text-xs text-gray-400">
              {lang === "ar" ? "هذه المعلومات تُستخدم فقط في العقد ولا تُحفظ." : lang === "fr" ? "Ces informations servent uniquement à générer le PDF." : "These details are used only for the PDF and are not saved."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {lang === "ar" ? "رقم الهوية" : lang === "fr" ? "N° CIN / Passeport" : "ID Number"}
                </label>
                <Input value={contractExtras.tenant_id_number} onChange={e => setContractExtras(p => ({ ...p, tenant_id_number: e.target.value }))} className="border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {lang === "ar" ? "التأمين (دج)" : lang === "fr" ? "Dépôt de garantie (DA)" : "Security Deposit (DA)"}
                </label>
                <Input type="number" value={contractExtras.deposit} onChange={e => setContractExtras(p => ({ ...p, deposit: e.target.value }))} className="border-gray-200 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                {lang === "ar" ? "عنوان المستأجر الحالي" : lang === "fr" ? "Adresse actuelle du locataire" : "Tenant's Current Address"}
              </label>
              <Input value={contractExtras.tenant_address} onChange={e => setContractExtras(p => ({ ...p, tenant_address: e.target.value }))} className="border-gray-200 text-sm" />
            </div>
            <div className="flex gap-2 items-center">
              {/* Language selector */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                {["fr", "ar", "en"].map(l => (
                  <button key={l} type="button"
                    onClick={() => setContractLang(l)}
                    className={`px-1.5 py-0.5 rounded transition-colors font-medium ${
                      contractLang === l ? "bg-emerald-600 text-white" : "hover:bg-gray-100 text-gray-500"
                    }`}>
                    {l === "fr" ? "FR" : l === "ar" ? "عر" : "EN"}
                  </button>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={handleGeneratePDF} disabled={generatingPdf || !form.tenant_name || !form.period_start_date || !form.rent_amount}
                className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                {generatingPdf
                  ? <><div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> {contractLang === "fr" ? "Génération..." : contractLang === "ar" ? "جاري الإنشاء..." : "Generating..."}</>
                  : <><FileText className="w-4 h-4" /> {contractLang === "ar" ? "تنزيل PDF" : contractLang === "fr" ? "Télécharger le PDF" : "Download PDF"}</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving || !form.listing_id || !form.tenant_name || !form.rent_amount || !form.period_start_date}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1">
          <Save className="w-4 h-4" />
          {saving ? "..." : (lang === "ar" ? "حفظ" : lang === "fr" ? "Enregistrer" : "Save Tenant")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}