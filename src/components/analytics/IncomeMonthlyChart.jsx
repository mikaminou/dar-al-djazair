import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const COLORS = ["#059669", "#0891b2", "#7c3aed", "#dc2626", "#ea580c"];

export default function IncomeMonthlyChart({ data, lang }) {
  const [view, setView] = useState("monthly");

  const T = {
    title: { en: "Income by Month", fr: "Revenu par Mois", ar: "الدخل حسب الشهر" },
    monthly: { en: "Monthly", fr: "Mensuel", ar: "شهري" },
    yearly: { en: "Yearly", fr: "Annuel", ar: "سنوي" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-400">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">{lang === "ar" ? "لا توجد بيانات دخل" : lang === "fr" ? "Aucune donnée disponible" : "No income data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <div className="flex gap-2">
          {["monthly", "yearly"].map(v => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              size="sm"
              onClick={() => setView(v)}
              className="text-xs"
            >
              {t(v)}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
            formatter={v => [`DZD ${v.toLocaleString()}`, ""]}
          />
          <Legend />
          {data[0] && Object.keys(data[0])
            .filter(k => k !== "month" && k !== "total")
            .map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          <Bar dataKey="total" fill="#059669" stroke="#047857" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}