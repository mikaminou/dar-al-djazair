import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, FileText, ChevronDown, ChevronUp } from "lucide-react";
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
    const doc = new jsPDF();
    const landlordName = currentUser?.full_name || "";
    const selectedListing = listings.find(l => l.id === form.listing_id);
    const propertyAddress = [selectedListing?.address, selectedListing?.commune, selectedListing?.wilaya].filter(Boolean).join(", ");
    const today = new Date().toLocaleDateString("fr-DZ");

    const drawLine = (y) => { doc.setDrawColor(180); doc.line(15, y, 195, y); };
    let y = 42;
    const section = (title) => {
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(title, 15, y); drawLine(y + 2); y += 8;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
    };
    const field = (label, val) => { doc.text(`${label} : ${val || "___________"}`, 18, y); y += 7; };

    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("CONTRAT DE LOCATION", 105, 20, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Fait à ${selectedListing?.wilaya || "___"}, le ${today}`, 105, 30, { align: "center" });

    section("ARTICLE 1 — PARTIES");
    field("Bailleur (Propriétaire)", landlordName);
    field("Téléphone bailleur", currentUser?.phone || "");
    field("Locataire (Nom complet)", form.tenant_name);
    if (contractExtras.tenant_id_number) field("N° Pièce d'identité", contractExtras.tenant_id_number);
    if (contractExtras.tenant_address) field("Adresse actuelle du locataire", contractExtras.tenant_address);
    field("Téléphone locataire", form.tenant_phone);

    y += 3;
    section("ARTICLE 2 — BIEN LOUÉ");
    field("Adresse du bien", propertyAddress);
    if (selectedListing?.property_type) field("Type de bien", selectedListing.property_type);
    if (selectedListing?.area) field("Surface", `${selectedListing.area} m²`);
    if (selectedListing?.rooms) field("Nombre de pièces", String(selectedListing.rooms));

    y += 3;
    const endDate = calculateEndDate();
    const months = { monthly: 1, trimestrial: 3, "6months": 6, yearly: 12, custom: parseInt(form.period_months) || 1 };
    const durationMonths = months[form.period_type] || 1;
    section("ARTICLE 3 — DURÉE DU CONTRAT");
    field("Date de début", form.period_start_date);
    field("Durée", `${durationMonths} mois`);
    field("Date de fin", endDate);

    y += 3;
    section("ARTICLE 4 — LOYER & DÉPÔT DE GARANTIE");
    field("Loyer", `${form.rent_amount} DZD`);
    if (contractExtras.deposit) field("Dépôt de garantie", `${contractExtras.deposit} DZD`);
    if (form.total_paid_upfront) field("Montant payé d'avance", `${form.total_paid_upfront} DZD`);
    field("Mode de paiement", "D'avance");

    y += 3;
    section("ARTICLE 5 — CONDITIONS PARTICULIÈRES");
    if (form.special_conditions) {
      const lines = doc.splitTextToSize(form.special_conditions, 170);
      doc.text(lines, 18, y); y += lines.length * 6 + 4;
    } else { doc.text("Néant", 18, y); y += 10; }

    y += 5;
    section("ARTICLE 6 — SIGNATURES");
    y += 5;
    doc.text("Bailleur :", 18, y); doc.text("Locataire :", 120, y);
    y += 20;
    doc.text("Signature & Date", 18, y); doc.text("Signature & Date", 120, y);

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
            <Button type="button" variant="outline" onClick={handleGeneratePDF} disabled={generatingPdf || !form.tenant_name || !form.period_start_date || !form.rent_amount}
              className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              {generatingPdf
                ? <><div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> {lang === "fr" ? "Génération..." : lang === "ar" ? "جاري الإنشاء..." : "Generating..."}</>
                : <><FileText className="w-4 h-4" /> {lang === "ar" ? "تنزيل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}</>
              }
            </Button>
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