import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

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

  useEffect(() => {
    loadListings();
    if (tenant) {
      setForm({
        listing_id: tenant.listing_id,
        property_address: tenant.property_address,
        tenant_name: tenant.tenant_name,
        tenant_phone: tenant.tenant_phone,
        rent_amount: tenant.rent_amount,
        period_type: tenant.period_type,
        period_months: tenant.period_months || "",
        total_paid_upfront: tenant.total_paid_upfront,
        period_start_date: tenant.period_start_date,
        special_conditions: tenant.special_conditions || ""
      });
    }
  }, [tenant]);

  async function loadListings() {
    const data = await base44.entities.Listing.filter({ created_by: currentUser.email, status: "active" }, "-created_date", 50);
    setListings(data);
  }

  function calculateEndDate() {
    if (!form.period_start_date) return "";
    const start = new Date(form.period_start_date);
    let monthsToAdd = 1;
    if (form.period_type === "trimestrial") monthsToAdd = 3;
    else if (form.period_type === "6months") monthsToAdd = 6;
    else if (form.period_type === "yearly") monthsToAdd = 12;
    else if (form.period_type === "custom") monthsToAdd = parseInt(form.period_months) || 1;

    const end = new Date(start);
    end.setMonth(end.getMonth() + monthsToAdd);
    end.setDate(end.getDate() - 1); // Last day of the period
    return end.toISOString().split("T")[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.listing_id || !form.tenant_name || !form.rent_amount) return;
    
    setSaving(true);
    const endDate = calculateEndDate();
    const payload = {
      ...form,
      rent_amount: parseFloat(form.rent_amount),
      total_paid_upfront: parseFloat(form.total_paid_upfront),
      period_months: form.period_type === "custom" ? parseInt(form.period_months) : null,
      period_end_date: endDate
    };
    
    await onSave(payload);
    setSaving(false);
  }

  const selectedListing = listings.find(l => l.id === form.listing_id);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {tenant ? (lang === "ar" ? "تعديل المستأجر" : lang === "fr" ? "Modifier le locataire" : "Edit Tenant") 
            : (lang === "ar" ? "إضافة مستأجر جديد" : lang === "fr" ? "Ajouter un nouveau locataire" : "Add New Tenant")}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Select Listing */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "العقار" : lang === "fr" ? "Propriété" : "Property"}
        </label>
        <Select value={form.listing_id} onValueChange={v => {
          const listing = listings.find(l => l.id === v);
          setForm(p => ({ ...p, listing_id: v, property_address: listing?.address || "" }));
        }}>
          <SelectTrigger>
            <SelectValue placeholder={lang === "ar" ? "اختر عقارك" : lang === "fr" ? "Choisir..." : "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {listings.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.title} ({l.address})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tenant Name */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "اسم المستأجر" : lang === "fr" ? "Nom du locataire" : "Tenant Name"} *
        </label>
        <Input value={form.tenant_name} onChange={e => setForm(p => ({ ...p, tenant_name: e.target.value }))} required />
      </div>

      {/* Tenant Phone */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone Number"}
        </label>
        <Input value={form.tenant_phone} onChange={e => setForm(p => ({ ...p, tenant_phone: e.target.value }))} placeholder="+213 ..." />
      </div>

      {/* Rent Amount */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "مبلغ الإيجار (دج)" : lang === "fr" ? "Montant du loyer (DA)" : "Rent Amount (DA)"} *
        </label>
        <Input type="number" value={form.rent_amount} onChange={e => setForm(p => ({ ...p, rent_amount: e.target.value }))} required />
      </div>

      {/* Period Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "مدة الدفع" : lang === "fr" ? "Durée de la période" : "Payment Period"} *
        </label>
        <Select value={form.period_type} onValueChange={v => setForm(p => ({ ...p, period_type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{lang === "ar" ? "شهري" : lang === "fr" ? "Mensuel" : "Monthly"}</SelectItem>
            <SelectItem value="trimestrial">{lang === "ar" ? "ثلاثي الأشهر" : lang === "fr" ? "Trimestriel" : "Trimestrial (3 months)"}</SelectItem>
            <SelectItem value="6months">{lang === "ar" ? "6 أشهر" : lang === "fr" ? "6 mois" : "6 Months"}</SelectItem>
            <SelectItem value="yearly">{lang === "ar" ? "سنوي" : lang === "fr" ? "Annuel" : "Yearly"}</SelectItem>
            <SelectItem value="custom">{lang === "ar" ? "مخصص" : lang === "fr" ? "Personnalisé" : "Custom"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Months */}
      {form.period_type === "custom" && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            {lang === "ar" ? "عدد الأشهر" : lang === "fr" ? "Nombre de mois" : "Number of Months"}
          </label>
          <Input type="number" min="1" value={form.period_months} onChange={e => setForm(p => ({ ...p, period_months: e.target.value }))} required />
        </div>
      )}

      {/* Total Paid Upfront */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "المبلغ المدفوع مقدماً (دج)" : lang === "fr" ? "Montant payé d'avance (DA)" : "Total Paid Upfront (DA)"} *
        </label>
        <Input type="number" value={form.total_paid_upfront} onChange={e => setForm(p => ({ ...p, total_paid_upfront: e.target.value }))} required />
      </div>

      {/* Period Start Date */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "تاريخ البداية" : lang === "fr" ? "Date de début" : "Period Start Date"} *
        </label>
        <Input type="date" value={form.period_start_date} onChange={e => setForm(p => ({ ...p, period_start_date: e.target.value }))} required />
      </div>

      {/* Period End Date (Read-only) */}
      {form.period_start_date && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            {lang === "ar" ? "تاريخ النهاية (محسوب تلقائياً)" : lang === "fr" ? "Date de fin (calculée automatiquement)" : "Period End Date (Auto-calculated)"}
          </label>
          <Input type="date" value={calculateEndDate()} disabled className="bg-gray-100" />
        </div>
      )}

      {/* Special Conditions */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {lang === "ar" ? "شروط خاصة" : lang === "fr" ? "Conditions spéciales" : "Special Conditions"}
        </label>
        <Textarea value={form.special_conditions} onChange={e => setForm(p => ({ ...p, special_conditions: e.target.value }))} rows={3} />
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1">
          <Save className="w-4 h-4" />
          {saving ? "..." : (lang === "ar" ? "حفظ" : lang === "fr" ? "Enregistrer" : "Save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}