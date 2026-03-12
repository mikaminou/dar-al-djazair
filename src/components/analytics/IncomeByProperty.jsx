import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr, ar } from "date-fns/locale";

export default function IncomeByProperty({ properties, lang }) {
  const T = {
    title: { en: "Income by Property", fr: "Revenu par Propriété", ar: "الدخل حسب العقار" },
    totalIncome: { en: "Total Income", fr: "Revenu Total", ar: "الإجمالي" },
    tenant: { en: "Tenant", fr: "Locataire", ar: "المستأجر" },
    period: { en: "Period", fr: "Période", ar: "الفترة" },
    expiry: { en: "Expires", fr: "Expire", ar: "ينتهي" },
    currentIncome: { en: "Period Income", fr: "Revenu de la Période", ar: "دخل الفترة" },
    noTenant: { en: "No active tenant", fr: "Aucun locataire actif", ar: "لا يوجد مستأجر نشط" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  const getLocale = () => (lang === "fr" ? fr : lang === "ar" ? ar : undefined);

  const getDaysLeft = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getExpiryColor = (daysLeft) => {
    if (daysLeft < 0) return "text-red-600 bg-red-50";
    if (daysLeft <= 30) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h2>
      <div className="space-y-4">
        {properties.map(prop => {
          const activeTenant = prop.activeTenant;
          const daysLeft = activeTenant ? getDaysLeft(activeTenant.period_end_date) : null;
          const expiryColor = daysLeft !== null ? getExpiryColor(daysLeft) : "";

          return (
            <Card key={prop.listing_id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{prop.property_address}</h3>
                  <p className="text-xs text-gray-500 mt-1">Total Income: DZD {prop.totalIncome.toLocaleString()}</p>
                </div>
              </div>

              {activeTenant ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t("tenant")}:</span>
                    <span className="font-medium text-gray-900">{activeTenant.tenant_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t("period")}:</span>
                    <span className="font-medium text-gray-900">{activeTenant.period_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t("currentIncome")}:</span>
                    <span className="font-medium text-emerald-600">DZD {activeTenant.rent_amount.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between items-center p-2 rounded-md ${expiryColor}`}>
                    <span className="text-gray-600">{t("expiry")}:</span>
                    <span className="font-medium">
                      {daysLeft < 0
                        ? `Ended ${Math.abs(daysLeft)} days ago`
                        : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  {t("noTenant")}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}