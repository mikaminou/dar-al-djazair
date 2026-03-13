import React from "react";
import { DollarSign, TrendingUp, Home, AlertCircle } from "lucide-react";
import { formatPrice } from "../price.config";

export default function RentalIncomeKPIs({ totalIncome, projectedAnnual, propertyCount, atRiskCount, lang }) {
  const T = {
    totalRental: { en: "Total Rental Income", fr: "Revenu Total Locatif", ar: "إجمالي دخل الإيجار" },
    projected: { en: "Projected Annual", fr: "Projection Annuelle", ar: "التوقع السنوي" },
    properties: { en: "Properties", fr: "Propriétés", ar: "العقارات" },
    atRisk: { en: "At Risk", fr: "À Risque", ar: "في الخطر" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  const kpis = [
    { key: "total",      label: t("totalRental"), value: totalIncome,     Icon: DollarSign, color: "emerald" },
    { key: "projected",  label: t("projected"),   value: projectedAnnual, Icon: TrendingUp, color: "blue" },
    { key: "properties", label: t("properties"),  value: propertyCount,   Icon: Home,       color: "indigo" },
    { key: "atRisk",     label: t("atRisk"),      value: atRiskCount,     Icon: AlertCircle, color: "amber" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.Icon;
        const bgColor = {
          emerald: "bg-emerald-50",
          blue: "bg-blue-50",
          indigo: "bg-indigo-50",
          amber: "bg-amber-50",
        }[kpi.color];
        const iconColor = {
          emerald: "text-emerald-600",
          blue: "text-blue-600",
          indigo: "text-indigo-600",
          amber: "text-amber-600",
        }[kpi.color];

        return (
          <div key={i} className={`${bgColor} rounded-lg p-4 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {(kpi.key === "total" || kpi.key === "projected")
                    ? formatPrice(kpi.value, "rent", lang)
                    : kpi.value}
                </p>
              </div>
              <Icon className={`w-8 h-8 ${iconColor} opacity-20`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}