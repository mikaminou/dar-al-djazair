import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Edit2, Trash2, ChevronRight, Phone, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import TenantPaymentPanel from "./TenantPaymentPanel";

export default function TenantList({ tenant, onEdit, onDelete, lang, currentUser }) {
  const [showPayments, setShowPayments] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  async function loadPayments() {
    setLoadingPayments(true);
    const data = await base44.entities.TenantPayment.filter({ tenant_id: tenant.id }, "-payment_date");
    setPayments(data);
    setLoadingPayments(false);
  }

  useEffect(() => {
    if (showPayments) loadPayments();
  }, [showPayments]);

  const today = new Date();
  const endDate = new Date(tenant.period_end_date);
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining <= 60 && daysRemaining > 0;

  return (
    <>
      <div className={`bg-white rounded-lg border p-4 transition-all ${isExpired ? "border-red-200 bg-red-50" : isExpiringSoon ? "border-amber-200 bg-amber-50" : "border-gray-100"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{tenant.tenant_name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" /> {tenant.tenant_phone}
            </p>
            <p className="text-sm text-gray-600 mt-1">{tenant.property_address}</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={onEdit} className="text-gray-400 hover:text-gray-600">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rent & Period Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-500 mb-1">{lang === "ar" ? "الإيجار الشهري" : lang === "fr" ? "Loyer" : "Monthly Rent"}</p>
            <p className="font-semibold text-emerald-700">{tenant.rent_amount.toLocaleString()} DA</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-500 mb-1">{lang === "ar" ? "المدفوع مقدماً" : lang === "fr" ? "Payé d'avance" : "Paid Upfront"}</p>
            <p className="font-semibold text-gray-900">{tenant.total_paid_upfront.toLocaleString()} DA</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-500 mb-1">{lang === "ar" ? "من" : lang === "fr" ? "Du" : "From"}</p>
            <p className="font-semibold text-gray-900">{new Date(tenant.period_start_date).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")}</p>
          </div>
          <div className="bg-white rounded p-3">
            <p className="text-xs text-gray-500 mb-1">{lang === "ar" ? "إلى" : lang === "fr" ? "Au" : "Until"}</p>
            <p className={`font-semibold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
              {new Date(tenant.period_end_date).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US")}
            </p>
          </div>
        </div>

        {/* Expiry Status */}
        <div className={`rounded p-3 mb-4 text-sm font-medium ${isExpired ? "bg-red-100 text-red-700" : isExpiringSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
          {isExpired ? (
            lang === "ar" ? `انتهت مدة العقد منذ ${Math.abs(daysRemaining)} يوم` : lang === "fr" ? `Expiré il y a ${Math.abs(daysRemaining)} jours` : `Expired ${Math.abs(daysRemaining)} days ago`
          ) : isExpiringSoon ? (
            lang === "ar" ? `ينتهي خلال ${daysRemaining} يوم` : lang === "fr" ? `Expire dans ${daysRemaining} jours` : `Expires in ${daysRemaining} days`
          ) : (
            lang === "ar" ? `ساري - ${daysRemaining} يوم متبقي` : lang === "fr" ? `Actif - ${daysRemaining} jours restants` : `Active - ${daysRemaining} days remaining`
          )}
        </div>

        {/* Special Conditions */}
        {tenant.special_conditions && (
          <div className="bg-blue-50 rounded p-3 mb-4 text-sm text-blue-700">
            <p className="font-medium mb-1">{lang === "ar" ? "ملاحظات خاصة" : lang === "fr" ? "Remarques" : "Notes"}:</p>
            <p>{tenant.special_conditions}</p>
          </div>
        )}

        {/* Payments Toggle */}
        <Button 
          variant="outline" 
          className="w-full gap-2 justify-between"
          onClick={() => setShowPayments(!showPayments)}
        >
          <span>{lang === "ar" ? "السجل المالي" : lang === "fr" ? "Historique des paiements" : "Payment History"}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showPayments ? "rotate-90" : ""}`} />
        </Button>
      </div>

      {/* Payments Panel */}
      {showPayments && (
        <div className="mt-4 pl-4">
          <TenantPaymentPanel 
            tenant={tenant} 
            payments={payments} 
            onPaymentAdded={loadPayments}
            lang={lang}
            currentUser={currentUser}
          />
        </div>
      )}
    </>
  );
}