import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";

export default function ProjectedRevenue({ projections, lang }) {
  const T = {
    title: { en: "Projected Annual Revenue", fr: "Revenu Annuel Prévu", ar: "الإيرادات السنوية المتوقعة" },
    nextMonths: { en: "Next 12 Months", fr: "12 Prochains Mois", ar: "الـ 12 شهر القادمة" },
    breakdown: { en: "Property Breakdown", fr: "Détail par Propriété", ar: "تفصيل العقار" },
    atRisk: { en: "At Risk (expires in 3 months)", fr: "À risque (expire en 3 mois)", ar: "في الخطر (ينتهي في 3 أشهر)" },
    noData: { en: "No active tenants", fr: "Aucun locataire actif", ar: "لا يوجد مستأجرون نشطون" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (!projections || projections.properties.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">{t("noData")}</p>
      </div>
    );
  }

  const getDaysLeft = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-0 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t("nextMonths")}</p>
            <p className="text-3xl font-bold text-emerald-700">DZD {projections.total.toLocaleString()}</p>
          </div>
          <TrendingUp className="w-12 h-12 text-emerald-200" />
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("breakdown")}</h3>
        <div className="space-y-2">
          {projections.properties.map((prop, i) => {
            const daysLeft = getDaysLeft(prop.period_end_date);
            const isAtRisk = daysLeft <= 90 && daysLeft > 0;
            const isExpired = daysLeft <= 0;

            return (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{prop.property_address}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{prop.tenant_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-emerald-600">DZD {prop.projectedIncome.toLocaleString()}</p>
                  {isAtRisk && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      At Risk
                    </span>
                  )}
                  {isExpired && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Expired
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}