import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Share2 } from "lucide-react";

export default function TenantPaymentPanel({ tenant, payments, onPaymentAdded, lang, currentUser }) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    period_months: tenant.period_type === "custom" ? tenant.period_months : (tenant.period_type === "monthly" ? 1 : tenant.period_type === "trimestrial" ? 3 : tenant.period_type === "6months" ? 6 : 12)
  });
  const [saving, setSaving] = useState(false);

  function calculatePeriod() {
    if (!form.payment_date) return { start: "", end: "" };
    const start = new Date(form.payment_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (parseInt(form.period_months) || 1));
    end.setDate(end.getDate() - 1);
    return {
      start: form.payment_date,
      end: end.toISOString().split("T")[0]
    };
  }

  async function handleAddPayment(e) {
    e.preventDefault();
    if (!form.amount || !form.payment_date) return;

    setSaving(true);
    const period = calculatePeriod();
    const refNumber = `RCP-${tenant.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const payment = await base44.entities.TenantPayment.create({
      tenant_id: tenant.id,
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      period_start_date: period.start,
      period_end_date: period.end,
      reference_number: refNumber,
      landlord_email: currentUser.email
    });

    // Update tenant period_end_date
    await base44.entities.Tenant.update(tenant.id, {
      period_end_date: period.end,
      total_paid_upfront: parseFloat(form.amount),
      period_start_date: period.start
    });

    setForm({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      period_months: form.period_months
    });
    setShowAddPayment(false);
    setSaving(false);
    onPaymentAdded();
  }

  async function generateReceipt(payment) {
    const response = await base44.functions.invoke("generateTenantReceipt", {
      payment_id: payment.id,
      tenant_name: tenant.tenant_name,
      landlord_email: currentUser.email,
      landlord_name: currentUser.full_name || currentUser.email,
      property_address: tenant.property_address,
      amount: payment.amount,
      period_start: payment.period_start_date,
      period_end: payment.period_end_date,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number
    });
    return response.data;
  }

  const period = calculatePeriod();

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4">
      {/* Add Payment Form */}
      {showAddPayment && (
        <form onSubmit={handleAddPayment} className="border-t pt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {lang === "ar" ? "المبلغ المدفوع (دج)" : lang === "fr" ? "Montant payé (DA)" : "Amount Paid (DA)"}
            </label>
            <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="0" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {lang === "ar" ? "تاريخ الدفع" : lang === "fr" ? "Date du paiement" : "Payment Date"}
            </label>
            <Input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} required />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {lang === "ar" ? "عدد الأشهر" : lang === "fr" ? "Nombre de mois" : "Number of Months"}
            </label>
            <Input type="number" min="1" value={form.period_months} onChange={e => setForm(p => ({ ...p, period_months: e.target.value }))} required />
          </div>

          {period.start && (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              {lang === "ar" ? `الفترة: من ${new Date(period.start).toLocaleDateString("ar-SA")} إلى ${new Date(period.end).toLocaleDateString("ar-SA")}` 
                : lang === "fr" ? `Période: du ${new Date(period.start).toLocaleDateString("fr-FR")} au ${new Date(period.end).toLocaleDateString("fr-FR")}`
                : `Period: from ${new Date(period.start).toLocaleDateString()} to ${new Date(period.end).toLocaleDateString()}`}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
              {lang === "ar" ? "تسجيل الدفع" : lang === "fr" ? "Enregistrer le paiement" : "Log Payment"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddPayment(false)} className="flex-1">
              {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
          </div>
        </form>
      )}

      {!showAddPayment && (
        <Button onClick={() => setShowAddPayment(true)} variant="outline" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          {lang === "ar" ? "تسجيل دفعة جديدة" : lang === "fr" ? "Enregistrer un nouveau paiement" : "Log New Payment"}
        </Button>
      )}

      {/* Payments List */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 text-sm">
            {lang === "ar" ? "السجل المالي" : lang === "fr" ? "Historique" : "Payment History"}
          </h4>
          {payments.map(payment => (
            <div key={payment.id} className="bg-gray-50 rounded p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{payment.amount.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === "ar" ? "من" : lang === "fr" ? "Du" : "From"} {new Date(payment.period_start_date).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")} {lang === "ar" ? "إلى" : lang === "fr" ? "au" : "to"} {new Date(payment.period_end_date).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={async () => {
                      const result = await generateReceipt(payment);
                      window.open(result.url, '_blank');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                    title={lang === "ar" ? "تحميل الوصل" : lang === "fr" ? "Télécharger" : "Download Receipt"}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={async () => {
                      const result = await generateReceipt(payment);
                      const text = encodeURIComponent(`I just received payment for rent. Receipt: ${result.url}`);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    }}
                    className="text-green-600 hover:text-green-700"
                    title={lang === "ar" ? "مشاركة على واتس آب" : lang === "fr" ? "Partager sur WhatsApp" : "Share on WhatsApp"}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400">{lang === "ar" ? "الرقم" : lang === "fr" ? "Référence" : "Ref"}: {payment.reference_number}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}