import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

export default function IncomeTrendsChart({ data, avgIncome, growthRate, lang }) {
  const T = {
    title: { en: "Income Trends (Last 12 Months)", fr: "Tendance du Revenu (12 Derniers Mois)", ar: "اتجاه الدخل (آخر 12 شهرًا)" },
    average: { en: "Average", fr: "Moyenne", ar: "المتوسط" },
    growth: { en: "Year-over-Year Growth", fr: "Croissance Annuelle", ar: "النمو السنوي" },
    noData: { en: "Insufficient data", fr: "Données insuffisantes", ar: "بيانات غير كافية" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (!data || data.length < 2) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        {growthRate !== null && (
          <div className="text-right">
            <p className="text-xs text-gray-600">{t("growth")}</p>
            <p className={`text-lg font-bold ${growthRate >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
            formatter={v => [`DZD ${v.toLocaleString()}`, ""]}
          />
          {avgIncome && <ReferenceLine y={avgIncome} stroke="#9ca3af" strokeDasharray="5 5" label={t("average")} />}
          <Line
            type="monotone"
            dataKey="income"
            stroke="#059669"
            strokeWidth={2}
            dot={{ fill: "#059669", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}