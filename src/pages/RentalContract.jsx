import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RentalContractPage() {
  const { lang } = useLang();
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tenant, setTenant] = useState({
    name: "",
    id_number: "",
    address: "",
    phone: "",
  });
  const [contractInfo, setContractInfo] = useState({
    start_date: "",
    duration_months: "12",
    monthly_rent: "",
    deposit: "",
    special_conditions: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing_id");
    Promise.all([
      base44.auth.me().catch(() => null),
      listingId ? base44.entities.Listing.filter({ id: listingId }) : Promise.resolve([]),
    ]).then(([me, listings]) => {
      setUser(me);
      if (listings.length > 0) {
        const l = listings[0];
        setListing(l);
        setContractInfo(c => ({ ...c, monthly_rent: l.price || "" }));
      }
      setLoading(false);
    });
  }, []);

  async function generatePDF() {
    setGenerating(true);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const today = new Date().toLocaleDateString("fr-DZ");
    const landlordName = user?.full_name || listing?.contact_name || "";
    const propertyAddress = [listing?.address, listing?.commune, listing?.wilaya].filter(Boolean).join(", ");

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRAT DE LOCATION", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fait à ${listing?.wilaya || "___"}, le ${today}`, 105, 30, { align: "center" });

    // Section separator
    const drawLine = (y) => { doc.setDrawColor(180); doc.line(15, y, 195, y); };

    let y = 42;
    const section = (title) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, y);
      drawLine(y + 2);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    };
    const field = (label, value) => {
      doc.text(`${label} : ${value || "___________"}`, 18, y);
      y += 7;
    };

    section("ARTICLE 1 — PARTIES");
    field("Bailleur (Propriétaire)", landlordName);
    field("Téléphone bailleur", listing?.contact_phone || user?.phone || "");
    field("Locataire (Nom complet)", tenant.name);
    field("N° Pièce d'identité", tenant.id_number);
    field("Adresse actuelle du locataire", tenant.address);
    field("Téléphone locataire", tenant.phone);

    y += 3;
    section("ARTICLE 2 — BIEN LOUÉ");
    field("Adresse du bien", propertyAddress);
    field("Type de bien", listing?.property_type || "");
    field("Surface", listing?.area ? `${listing.area} m²` : "");
    field("Nombre de pièces", listing?.rooms || "");

    y += 3;
    section("ARTICLE 3 — DURÉE DU CONTRAT");
    field("Date de début", contractInfo.start_date);
    field("Durée", `${contractInfo.duration_months} mois`);
    const endDate = contractInfo.start_date
      ? new Date(new Date(contractInfo.start_date).setMonth(new Date(contractInfo.start_date).getMonth() + Number(contractInfo.duration_months))).toLocaleDateString("fr-DZ")
      : "___";
    field("Date de fin", endDate);

    y += 3;
    section("ARTICLE 4 — LOYER & DÉPÔT DE GARANTIE");
    field("Loyer mensuel", `${contractInfo.monthly_rent} DZD`);
    field("Dépôt de garantie", contractInfo.deposit ? `${contractInfo.deposit} DZD` : "");
    field("Mode de paiement", "Mensuel, d'avance");

    y += 3;
    section("ARTICLE 5 — CONDITIONS PARTICULIÈRES");
    if (contractInfo.special_conditions) {
      const lines = doc.splitTextToSize(contractInfo.special_conditions, 170);
      doc.text(lines, 18, y);
      y += lines.length * 6 + 4;
    } else {
      doc.text("Néant", 18, y);
      y += 10;
    }

    y += 5;
    section("ARTICLE 6 — SIGNATURES");
    y += 5;
    doc.text("Bailleur :", 18, y);
    doc.text("Locataire :", 120, y);
    y += 20;
    doc.text("Signature & Date", 18, y);
    doc.text("Signature & Date", 120, y);

    doc.save(`contrat-location-${listing?.id || "draft"}.pdf`);
    setGenerating(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      {lang === "ar" ? "لم يتم العثور على الإعلان" : lang === "fr" ? "Annonce introuvable" : "Listing not found"}
    </div>
  );

  const labelCls = "text-sm font-medium text-gray-700 mb-1 block";
  const inputCls = "border-gray-200 focus:border-emerald-400 bg-white text-gray-900 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">
            {lang === "ar" ? "إنشاء عقد إيجار" : lang === "fr" ? "Générer un contrat de location" : "Generate Rental Contract"}
          </h1>
          <p className="text-emerald-200 text-sm mt-1">{listing.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Tenant info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">
            {lang === "ar" ? "معلومات المستأجر" : lang === "fr" ? "Informations du locataire" : "Tenant Information"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>{lang === "ar" ? "الاسم الكامل" : lang === "fr" ? "Nom complet" : "Full name"}</Label>
              <Input className={inputCls} value={tenant.name} onChange={e => setTenant(t => ({ ...t, name: e.target.value }))} placeholder="Mohamed Benali" />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "رقم الهوية" : lang === "fr" ? "N° CIN / Passeport" : "ID number"}</Label>
              <Input className={inputCls} value={tenant.id_number} onChange={e => setTenant(t => ({ ...t, id_number: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "العنوان الحالي" : lang === "fr" ? "Adresse actuelle" : "Current address"}</Label>
              <Input className={inputCls} value={tenant.address} onChange={e => setTenant(t => ({ ...t, address: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}</Label>
              <Input className={inputCls} value={tenant.phone} onChange={e => setTenant(t => ({ ...t, phone: e.target.value }))} placeholder="0555 000 000" />
            </div>
          </div>
        </div>

        {/* Contract info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">
            {lang === "ar" ? "تفاصيل العقد" : lang === "fr" ? "Détails du contrat" : "Contract Details"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>{lang === "ar" ? "تاريخ البداية" : lang === "fr" ? "Date de début" : "Start date"}</Label>
              <Input type="date" className={inputCls} value={contractInfo.start_date} onChange={e => setContractInfo(c => ({ ...c, start_date: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "مدة العقد (أشهر)" : lang === "fr" ? "Durée (mois)" : "Duration (months)"}</Label>
              <Input type="number" className={inputCls} value={contractInfo.duration_months} onChange={e => setContractInfo(c => ({ ...c, duration_months: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "الإيجار الشهري (DZD)" : lang === "fr" ? "Loyer mensuel (DZD)" : "Monthly rent (DZD)"}</Label>
              <Input type="number" className={inputCls} value={contractInfo.monthly_rent} onChange={e => setContractInfo(c => ({ ...c, monthly_rent: e.target.value }))} />
            </div>
            <div>
              <Label className={labelCls}>{lang === "ar" ? "التأمين (DZD)" : lang === "fr" ? "Dépôt de garantie (DZD)" : "Security deposit (DZD)"}</Label>
              <Input type="number" className={inputCls} value={contractInfo.deposit} onChange={e => setContractInfo(c => ({ ...c, deposit: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4">
            <Label className={labelCls}>{lang === "ar" ? "شروط خاصة" : lang === "fr" ? "Conditions particulières" : "Special conditions"}</Label>
            <Textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={contractInfo.special_conditions}
              onChange={e => setContractInfo(c => ({ ...c, special_conditions: e.target.value }))}
              placeholder={lang === "ar" ? "أي شروط إضافية..." : lang === "fr" ? "Toute condition supplémentaire..." : "Any additional conditions..."}
            />
          </div>
        </div>

        <Button
          onClick={generatePDF}
          disabled={generating || !tenant.name || !contractInfo.start_date}
          className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 h-12 text-base"
        >
          {generating ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {lang === "ar" ? "جاري الإنشاء..." : lang === "fr" ? "Génération en cours..." : "Generating..."}</>
          ) : (
            <>📄 {lang === "ar" ? "تنزيل عقد PDF" : lang === "fr" ? "Télécharger le contrat PDF" : "Download PDF Contract"}</>
          )}
        </Button>
      </div>
    </div>
  );
}